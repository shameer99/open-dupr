from playwright.sync_api import sync_playwright, Page, expect
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    page.goto("http://localhost:5173/login")

    # Fill in the email and password
    page.locator("#email").fill("erlich.bachman@opendupr.com")
    page.locator("#password").fill("bYtqoh-2ficjo-quptoc")
    time.sleep(1)

    # Click the sign in button
    page.get_by_role("button", name="Sign in").click()

    # Wait for navigation to the profile page
    expect(page).to_have_url("http://localhost:5173/profile")

    # Click the theme toggle button
    page.get_by_role("button", name="Toggle theme").click()

    # Wait for the theme to change by checking the html element class
    expect(page.locator("html")).to_have_class("dark")

    page.screenshot(path="jules-scratch/verification/dark-mode.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
