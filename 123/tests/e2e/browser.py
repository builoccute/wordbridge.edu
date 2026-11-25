"""Run against an isolated localhost database. Requires Playwright and Chromium."""
import os
import sqlite3
import subprocess
import tempfile
import time
from urllib.request import urlopen

from playwright.sync_api import sync_playwright

BASE = 'http://localhost:8799'
WIDTHS = [360, 390, 430, 768, 1024, 1280, 1440, 1920]
ROUTES = (
    '/ /register /login /learning /learning/chinese /learning/english /learning/skills '
    '/skills/pronunciation /help /practice /specialized /flashcards/reading /flashcards/listening '
    '/flashcards/grammar /flashcards/writing /flashcards/speaking /vocabulary/flashcards /missing-page'
).split()


def check_account(page, database):
    account = dict(email='browser@example.test', password='LocalTestPass123',
                   confirmPassword='LocalTestPass123', fullName='Browser Test',
                   dateOfBirth='1996-04-12', phoneNumber='0912345678',
                   schoolName='Test school', workplaceName='Test work')
    assert page.request.post(BASE + '/api/v1/auth/register', data=account).status == 201
    # Isolate browser authentication from SMTP. The integration suite exercises the email token.
    with sqlite3.connect(database) as db:
        db.execute("UPDATE wb_accounts SET email_verified=1,status='active' WHERE email=?", (account['email'],))
    assert page.request.post(BASE + '/api/v1/auth/login', data=account).status == 200
    page.goto(BASE + '/account/passkeys')
    cdp = page.context.new_cdp_session(page)
    cdp.send('WebAuthn.enable')
    cdp.send('WebAuthn.addVirtualAuthenticator', {'options': {
        'protocol': 'ctap2', 'transport': 'internal', 'hasResidentKey': True,
        'hasUserVerification': True, 'isUserVerified': True, 'automaticPresenceSimulation': True}})
    with page.expect_response('**/register/verify') as registration:
        page.locator('[data-passkey=register]').click()
    assert registration.value.status == 201
    page.wait_for_load_state()
    page.context.clear_cookies()
    page.goto(BASE + '/login')
    with page.expect_response('**/authenticate/verify') as login:
        page.locator('[data-passkey=authenticate]').click()
    assert login.value.status == 200
    page.goto(BASE + '/flashcards/writing')
    page.locator('[name=responseText]').fill('My study note')
    page.locator('[name=remembered]').select_option('1')
    with page.expect_response('**/flashcards/review') as save:
        page.locator('form[data-api-endpoint$="/flashcards/review"] button').click()
    assert save.value.status == 200
    page.reload()
    assert page.locator('[name=responseText]').input_value() == 'My study note'

    page.goto(BASE + '/skills/pronunciation')
    page.locator('[data-wb-record-toggle]').click()
    page.locator('[data-wb-record-status]').filter(has_text='Đang ghi').wait_for(timeout=5000)
    page.wait_for_timeout(400)
    page.locator('[data-wb-record-toggle]').click()
    playback = page.locator('audio[src^="blob:"]')
    playback.wait_for(timeout=5000)
    playback.evaluate('(audio) => audio.play()')
    assert playback.evaluate('(audio) => !audio.paused || audio.ended')
    page.goto(BASE + '/account/passkeys')
    with page.expect_response(lambda r: r.request.method=='DELETE' and '/passkeys/' in r.url) as revoke:
        page.locator('form[data-api-method=DELETE] button').click()
    assert revoke.value.status == 200


def run(database):
    with sync_playwright() as driver:
        browser = driver.chromium.launch(executable_path=os.getenv('CHROME_BIN'),
                  args=['--no-sandbox', '--no-zygote', '--single-process', '--disable-gpu','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream'])
        page = browser.new_page()
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        for route in ROUTES:
            response = page.goto(BASE + route)
            assert response.status == (404 if route == '/missing-page' else 200), route
            for width in WIDTHS:
                page.set_viewport_size({'width': width, 'height': 900})
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), (route, width)
        page.goto(BASE + '/login')
        page.locator('[data-wb-locale]').select_option('en')
        assert page.locator('html').get_attribute('lang') == 'en'
        check_account(page, database)
        assert not errors, errors
        print(f'{len(ROUTES)*len(WIDTHS)} layout checks, locale, Passkey and persisted skill review passed.')
        browser.close()


if __name__ == '__main__':
    with tempfile.TemporaryDirectory() as directory:
        database = directory + '/qa.sqlite'
        server = subprocess.Popen(['node','scripts/run-local-dev.mjs'],
                  env={**os.environ,'PORT':'8799','WB_LOCAL_DB':database})
        try:
            for _ in range(100):
                try:
                    with urlopen(BASE, timeout=2):
                        break
                except OSError:
                    time.sleep(.1)
            run(database)
        finally:
            server.terminate()
            server.wait()
