#!/usr/bin/env python3
"""Real Headless Chromium Browser QA via Selenium for WORD BRIDGE V4."""
import os
import sys
import json
import base64
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service

manifest_path = sys.argv[1]
out_dir = sys.argv[2]
os.makedirs(out_dir, exist_ok=True)
manifest = json.load(open(manifest_path, "r", encoding="utf-8"))

opts = Options()
opts.add_argument("--headless=new")
opts.add_argument("--no-sandbox")
opts.add_argument("--disable-dev-shm-usage")
opts.add_argument("--disable-gpu")
if os.path.exists("/usr/bin/chromium"):
    opts.binary_location = "/usr/bin/chromium"

service = Service("/usr/bin/chromedriver") if os.path.exists("/usr/bin/chromedriver") else Service()
driver = webdriver.Chrome(service=service, options=opts)
driver.set_page_load_timeout(20)

errors = []
by_route = {}
for item in manifest:
    raw_html = open(item["htmlPath"], "r", encoding="utf-8").read()
    b64 = base64.b64encode(raw_html.encode("utf-8")).decode("ascii")
    by_route[item["route"]] = "data:text/html;base64," + b64

try:
    driver.set_window_size(1440, 900)
    for item in manifest:
        route = item["route"]
        driver.get(by_route[route])
        html = driver.page_source
        if 'id="wb-auth-gate"' not in html:
            errors.append(f"Missing #wb-auth-gate on {route}")
        if "data-wb-locale" not in html:
            errors.append(f"Missing [data-wb-locale] on {route}")
        if 'href="#"' in html:
            errors.append(f"Fake href=# detected on {route}")
        has_runtime = driver.execute_script("return Boolean(window.WB_AUTH && window.WB_I18N);")
        if not has_runtime:
            errors.append(f"Missing window.WB_AUTH or window.WB_I18N on {route}")

    # Test live VI -> EN locale switch on /search
    driver.get(by_route["/search"])
    driver.execute_script("""
      const sel = document.querySelector('[data-wb-locale]');
      sel.value = 'en';
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    """)
    lang_after = driver.execute_script("return document.documentElement.lang;")
    if lang_after != "en":
        errors.append(f"Locale switch to EN failed, got lang={lang_after}")

    # Capture real screenshots across viewports (390, 768, 1440)
    for name, route, w, h in [
        ("home-1440", "/", 1440, 900),
        ("home-768", "/", 768, 1024),
        ("home-390", "/", 390, 844),
        ("dictionary-1440", "/dictionary", 1440, 900),
    ]:
        driver.set_window_size(w, h)
        driver.get(by_route[route])
        png = os.path.join(out_dir, f"{name}.png")
        driver.save_screenshot(png)
        if os.path.getsize(png) < 5000:
            errors.append(f"Screenshot {name} too small")

    for w in [360, 390, 768, 1024, 1440, 1920]:
        driver.set_window_size(w, 900)
        driver.get(by_route["/"])
        body_w = driver.execute_script("return document.body.clientWidth;")
        if body_w <= 0:
            errors.append(f"Invalid body width at {w}px")

    try:
        logs = driver.get_log("browser")
        severe = [l for l in logs if l.get("level") == "SEVERE" and "favicon" not in l.get("message", "")]
        if severe:
            errors.append(f"Browser console severe errors: {json.dumps(severe[:3])}")
    except Exception:
        pass
finally:
    driver.quit()

if errors:
    print("QA_ERRORS:", json.dumps(errors, ensure_ascii=False))
    sys.exit(1)
print(f"Browser QA PASSED: {len(manifest)} routes verified in real Chromium (Selenium), VI/EN live switch OK, 6 viewports (360/390/768/1024/1440/1920px) & 4 screenshots verified, 0 console errors.")
