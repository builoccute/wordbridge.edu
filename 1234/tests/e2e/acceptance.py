"""Run from the repository root. Uses an isolated SQLite DB, loopback and Chromium."""
import hashlib
import json
import os
import secrets
import shutil
import socket
import sqlite3
import subprocess
import tempfile
import urllib.error
import urllib.request
from pathlib import Path

from lxml import html
from playwright.sync_api import sync_playwright, Error as BrowserError
import re

WIDTHS = [360, 390, 768, 1024, 1440, 1920]
PAGES = ['/search','/learning','/learning/path','/learning/skills','/practice',
         '/practice/listening','/practice/speaking','/practice/reading','/practice/writing',
         '/practice/vocabulary','/practice/grammar','/dictionary','/vocabulary/flashcards',
         '/specialized','/specialized/cat-got-kim-loai','/my-knowledge','/my-mistakes',
         '/practice/history','/examinations','/learner-meet','/missing-page']
PAGES += ['/skills/'+s for s in ['vocabulary','grammar','listening','speaking','pronunciation','reading','writing']]

def run():
    with tempfile.TemporaryDirectory() as tmp:
        dbpath = str(Path(tmp)/'acceptance.sqlite')
        with socket.socket() as listener:
            listener.bind(('127.0.0.1',0))
            port=listener.getsockname()[1]
        base=f'http://127.0.0.1:{port}'
        process=subprocess.Popen(['node','scripts/run-local-dev.mjs'],env={**os.environ,'PORT':str(port),'WB_LOCAL_DB':dbpath},stdout=subprocess.PIPE,text=True)
        try:
            assert 'local server' in process.stdout.readline()
            session=secrets.token_hex(32)
            with sqlite3.connect(dbpath) as db:
                db.execute("INSERT INTO wb_accounts(id,email,full_name,date_of_birth,phone_number,school_name,workplace_name,status) VALUES ('qa','qa@example.invalid','QA','2000-01-01','','','','active')")
                db.execute("INSERT INTO wb_sessions(id,account_id,session_token_hash,csrf_token,expires_at) VALUES ('qa','qa',?,'csrf-qa',datetime('now','+1 hour'))",(hashlib.sha256(session.encode()).hexdigest(),))
                entry=db.execute("SELECT id FROM wb_dictionary_entries WHERE review_status='published' ORDER BY id LIMIT 1").fetchone()[0]
                db.execute("INSERT INTO wb_vocabulary_notebook(id,account_id,entry_id) VALUES ('nb-qa','qa',?)",(entry,))
            client=urllib.request.build_opener(urllib.request.ProxyHandler({}))
            def fetch(path):
                try: response=client.open(urllib.request.Request(base+path,headers={'Cookie':'wb_session='+session}))
                except urllib.error.HTTPError as error: response=error
                assert response.status==(404 if path=='/missing-page' else 200),(path,response.status)
                return response.read().decode()
            for path in PAGES:
                doc=html.fromstring(fetch(path))
                assert len(doc.xpath('//main'))==1 and doc.xpath('//main//h1'),path
                assert doc.xpath('//a[@href="#wb-main"]') and doc.xpath('//dialog[@aria-labelledby]'),path
                assert not doc.xpath('//a[@href="#"]'),path
                for button in doc.xpath('//button'):
                    assert button.text_content().strip() or button.get('aria-label') or button.get('aria-labelledby'),(path,button.attrib)
                for field in doc.xpath('//input[not(@type="hidden")] | //select | //textarea'):
                    assert field.get('aria-label') or field.xpath('ancestor::label') or doc.xpath('//label[@for=$id]',id=field.get('id','')), (path,field.attrib)
            print('HTTP/parsed DOM and accessible names PASS',len(PAGES),'pages')
            css=fetch('/styles/design-system.css')
            media=re.findall(r'@media\s*\(max-width:\s*(\d+)px\)\s*\{([^@]+)',css)
            for width in WIDTHS:
                active=[body for maximum,body in media if width<=int(maximum)]
                assert width>900 or any('.wb-menu-toggle' in body for body in active)
                assert width>620 or any('.wb-search-shell' in body for body in active)
                print('CSS media conditions',width,'px',len(active),'matching blocks')
            assert 'prefers-reduced-motion' in css and ':focus-visible' in css
            def luminance(color):
                rgb=[int(color[k:k+2],16)/255 for k in (0,2,4)]
                return sum(weight*(v/12.92 if v<=0.04045 else ((v+0.055)/1.055)**2.4) for weight,v in zip([0.2126,0.7152,0.0722],rgb))
            for fg,bg in [('0D1F22','FFFFFF'),('496166','FFFFFF'),('FFFFFF','035257'),('EAF4F4','0E2529'),('9FC2C5','0E2529')]:
                assert '#'+fg in css and '#'+bg in css
                light,dark=sorted([luminance(fg),luminance(bg)],reverse=True)
                ratio=(light+0.05)/(dark+0.05)
                assert ratio>=4.5
                print('Palette contrast',fg,bg,round(ratio,2))

            with sync_playwright() as runner:
                try: browser=runner.chromium.launch(executable_path=shutil.which('chromium'),chromium_sandbox=True)
                except BrowserError as exc:
                    print('BROWSER BLOCKED',str(exc).split('Call log:')[0][-1700:])
                    raise SystemExit(77)
                page=browser.new_page()
                page.goto(base+'/search?locale=vi')
                page.locator('[name=q]').fill('metal cutting')
                page.locator('form[role=search] button[type=submit]').click()
                assert page.locator('dialog').evaluate('(d)=>d.open && d.contains(document.activeElement)')
                page.keyboard.press('Escape')
                assert not page.locator('dialog').evaluate('d=>d.open')
                page.context.add_cookies([{'name':'wb_session','value':session,'url':base}])
                page.goto(base+'/vocabulary/review?mode=reverse')
                page.locator('.wb-study-surface').first.focus()
                page.keyboard.press('Space')
                assert page.locator('[data-wb-back]').first.is_visible()
                for locale in ['en','vi']:
                    page.locator('[data-wb-locale]').select_option(locale)
                    assert page.locator('[data-wb-back]').first.is_visible() and 'mode=reverse' in page.url
                page.locator('.wb-study-surface').first.focus()
                page.route('**/api/v1/vocabulary/review',lambda route:route.fulfill(status=503,json={'ok':False}))
                page.keyboard.press('3')
                page.locator('[data-form-status].wb-alert-error').wait_for()
                page.unroute('**/api/v1/vocabulary/review')
                with page.expect_response(lambda r:r.url.endswith('/api/v1/vocabulary/review') and r.status==200):
                    page.keyboard.press('3')
                page.reload()
                assert page.locator('[data-wb-study-card]').count()==0
                for width in WIDTHS:
                    page.set_viewport_size({'width':width,'height':900})
                    for path in PAGES:
                        page.goto(base+path)
                        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(width,path)
                browser.close()
                print('BROWSER PASS')
        finally:
            process.terminate()
            process.wait()

if __name__=='__main__':
    run()
