from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # The user ID is hardcoded to 1. This might need to be changed if user 1 doesn't have followers.
    page.goto("http://localhost:5173/player/1/social")

    # Wait for the followers list to be visible
    page.wait_for_selector(".space-y-3")

    page.screenshot(path="jules-scratch/verification/ratings.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
