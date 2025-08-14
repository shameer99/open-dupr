from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        print("Navigating to login page...")
        page.goto("http://localhost:5173/login")

        print("Filling in credentials...")
        page.locator("#email").fill("erlich.bachman@opendupr.com")
        page.locator("#password").fill("bYtqoh-2ficjo-quptoc")

        print("Clicking sign in button...")
        page.get_by_role("button", name="Sign in").click()

        print("Waiting for profile page...")
        page.wait_for_url("**/profile")

        print("Opening menu...")
        header = page.locator("header")
        buttons = header.get_by_role("button")
        menu_button = buttons.nth(1)
        menu_button.click()

        print("Clicking search players button...")
        page.get_by_role("button", name="Search Players").click()

        print("Waiting for search page...")
        page.wait_for_url("**/search")

        print("Taking screenshot...")
        page.screenshot(path="/app/jules-scratch/verification/animation_verification.png")
        print("Screenshot taken.")

    finally:
        print("Closing browser...")
        browser.close()
        print("Browser closed.")

with sync_playwright() as playwright:
    run(playwright)
print("Script finished.")
