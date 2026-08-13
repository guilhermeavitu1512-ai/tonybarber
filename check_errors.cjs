const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('PAGE ERROR:', msg.text());
    }
  });

  page.on('pageerror', error => {
    console.log('PAGE UNCAUGHT EXCEPTION:', error.message);
  });

  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    console.log('Page loaded successfully.');
  } catch (err) {
    console.log('FAILED TO LOAD:', err.message);
  }

  await browser.close();
})();
