from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()
    page.goto("http://localhost:5173/user/1")

    # Click the avatar
    avatar = page.locator('div[class*="rounded-full"][class*="flex"][class*="items-center"][class*="justify-center"]')
    avatar.first.click()

    # Wait for the modal to appear
    page.wait_for_selector('div[role="dialog"]')

    page.screenshot(path="jules-scratch/verification/verification.png")
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
