from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()

    # Test with image
    page.goto("http://localhost:5173/user/1")

    # Click the avatar
    avatar_with_image = page.locator('div[class*="rounded-full"]').first
    avatar_with_image.click()

    # Wait for the modal to appear
    modal_with_image = page.locator('div[role="dialog"]')
    expect(modal_with_image).to_be_visible()

    page.screenshot(path="jules-scratch/verification/verification_with_image.png")

    # Close the modal
    modal_with_image.click()
    expect(modal_with_image).not_to_be_visible()

    # Test with monogram (initials)
    # I'll navigate to a user that likely doesn't have an image.
    page.goto("http://localhost:5173/user/123456")

    # Click the avatar
    avatar_with_monogram = page.locator('div[class*="rounded-full"]').first
    avatar_with_monogram.click()

    # Wait for the modal to appear
    modal_with_monogram = page.locator('div[role="dialog"]')
    expect(modal_with_monogram).to_be_visible()

    page.screenshot(path="jules-scratch/verification/verification_with_monogram.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
