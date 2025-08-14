from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        page.goto("http://localhost:5173/login")

        page.locator("#email").fill("erlich.bachman@opendupr.com")
        page.locator("#password").fill("bYtqoh-2ficjo-quptoc")

        page.get_by_role("button", name="Sign in").click()

        # Wait for navigation to profile page
        page.wait_for_url("**/profile")

        # Open the menu
        # The menu button is the second button in the header
        header = page.locator("header")
        buttons = header.get_by_role("button")
        menu_button = buttons.nth(1)
        menu_button.click()

        # Click on the search players button
        page.get_by_role("button", name="Search Players").click()

        # Wait for navigation to search page
        page.wait_for_url("**/search")

        # Take a screenshot
        page.screenshot(path="jules-scratch/verification/animation_verification.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
