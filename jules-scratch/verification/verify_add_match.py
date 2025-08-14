import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        try:
            # 1. Navigate to the login page
            await page.goto("http://localhost:5173/login", timeout=60000)

            # Wait for the email input to be visible
            await expect(page.get_by_label("Email")).to_be_visible(timeout=10000)

            # 2. Log in
            await page.get_by_label("Email").fill("erlich.bachman@opendupr.com")
            await page.get_by_label("Password").fill("bYtqoh-2ficjo-quptoc")

            login_button = page.get_by_role("button", name="Sign in")
            await expect(login_button).to_be_enabled(timeout=10000)
            await login_button.click()

            # Take a screenshot after login attempt
            await page.screenshot(path="jules-scratch/verification/after_login_attempt.png")

            # Wait for navigation to the profile page
            await expect(page).to_have_url("http://localhost:5173/profile", timeout=10000)

            # 3. Navigate to the "Record Match" page
            add_match_button = page.get_by_role("button", name="Add Match")
            await expect(add_match_button).to_be_visible(timeout=10000)
            await add_match_button.click()

            await expect(page).to_have_url("http://localhost:5173/record-match")

            # Wait for the page to load, look for the "Your Team" heading
            await expect(page.get_by_role("heading", name="Your Team")).to_be_visible()

            # 4. Take a screenshot
            await page.screenshot(path="jules-scratch/verification/verification.png")

        except Exception as e:
            print(f"An error occurred: {e}")
            await page.screenshot(path="jules-scratch/verification/error.png")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
