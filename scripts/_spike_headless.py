"""Headless WebGL smoke for the T-P2-395 dice spike (standalone harness).
Drives /dice-threejs-spike.html, runs the AC matrix, reads results.
Confirms the OBJECTIVE half: roll() returns the @ target value at runtime.
(Visual 'no snap / purple theme' remains operator sign-off.)"""
import json
import sys
from playwright.sync_api import sync_playwright

URL = "http://127.0.0.1:5173/dice-threejs-spike.html"
FLAGS = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
         "--ignore-gpu-blocklist", "--enable-webgl"]


def main():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=FLAGS)
        page = browser.new_page()
        page.on("console", lambda m: errors.append(f"[{m.type}] {m.text}") if m.type in ("error", "warning") else None)
        page.on("pageerror", lambda e: errors.append(f"[pageerror] {e}"))
        page.goto(URL, wait_until="domcontentloaded", timeout=30000)
        page.wait_for_function("() => window.__spikeReady === true || window.__spikeError", timeout=45000)
        if page.evaluate("() => window.__spikeError"):
            print(json.dumps({"init_error": page.evaluate("() => window.__spikeError"), "logs": errors[:30]}, ensure_ascii=False, indent=2))
            browser.close()
            return 1
        results = page.evaluate("() => window.runSpike()")  # awaits the promise
        browser.close()

    # Summarize
    summary = {}
    for r in results:
        summary[r["note"]] = summary.get(r["note"], [])
        summary[r["note"]].append({"notation": r["notation"], "expected": r["expected"], "returned": r["returned"], "match": r["match"]})
    print(json.dumps({"rows": results, "console_errors": errors[:30]}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
