import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        await page.goto("http://localhost:4173/user/1/social?tab=followers")
        await page.wait_for_timeout(2000)
        await page.screenshot(path="jules-scratch/verification/verification_followers.png")

        await page.goto("http://localhost:4173/user/1/social?tab=following")
        await page.wait_for_timeout(2000)
        await page.screenshot(path="jules-scratch/verification/verification_following.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
