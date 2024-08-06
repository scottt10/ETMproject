const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();

        // Navigate to the login page
        console.log('Navigating to login page...');
        await page.goto('http://localhost:3000/backend', { waitUntil: 'networkidle2', timeout: 60000 });

        // Set screen size
        await page.setViewport({ width: 1080, height: 1024 });

        // Wait for the username input to be available
        await page.waitForSelector('input[name="username"]', { visible: true });
        await page.type('input[name="username"]', 'sushantAdmin'); // Adjust selector and credentials

        // Wait for the password input to be available
        await page.waitForSelector('input[name="password"]', { visible: true });
        await page.type('input[name="password"]', 'sushant'); // Adjust selector and credentials

        // Wait for the submit button to be available
        await page.waitForSelector('button[type="submit"]', { visible: true });
        await page.click('button[type="submit"]');

        // Wait for the page to load after login and redirection to /admin
        console.log('Waiting for navigation after login...');
        // await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 });

        // Check if the current URL is /admin
        const currentUrl = page.url();
        if (currentUrl !== 'http://localhost:3000/backend') {
            throw new Error('Redirection to /admin failed');
        }

        // Wait for the submit button to be available on the admin page
        await page.waitForSelector('button[type="submit"]', { visible: true });
        await page.click('button[type="submit"]');

        // Wait for a few seconds to observe the change
        await new Promise(resolve => setTimeout(resolve, 5000));

        await browser.close();
        console.log('Script completed successfully.');
    } catch (error) {
        console.error('An error occurred:', error);
    }
})();