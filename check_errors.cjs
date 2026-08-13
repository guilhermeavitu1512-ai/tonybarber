const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
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
    console.log('Navigating to /');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    console.log('Testing clicks on /');
    
    // Try to click Agendar
    await page.click('a[href="/agendar"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log('Navigated to /agendar');
    
    // Check if step 1 is rendered
    const step1Rendered = await page.evaluate(() => {
      return document.body.innerHTML.includes('Profissional');
    });
    console.log('Step 1 rendered:', step1Rendered);

  } catch (err) {
    console.log('FAILED TO LOAD/CLICK:', err.message);
  }

  await browser.close();
})();
