import asyncio
from playwright.async_api import async_playwright
import os

async def main():
    print("Starting playwright script")
    async with async_playwright() as p:
        print("Launching browser")
        browser = await p.chromium.launch()
        print("Creating new page")
        page = await browser.new_page()
        url = "http://localhost:4173/user/1/social?tab=followers"
        print(f"Going to {url}")
        await page.goto(url)
        print("Waiting for timeout")
        await page.wait_for_timeout(2000)  # Wait for the page to load
        screenshot_path = "/app/jules-scratch/verification/verification.png"
        print(f"Taking screenshot to {screenshot_path}")
        await page.screenshot(path=screenshot_path)
        print("Closing browser")
        await browser.close()
        print("Script finished")

if __name__ == "__main__":
    asyncio.run(main())
