const puppeteer = require('puppeteer');

async function checkConsole() {
    console.log('Launching puppeteer...');
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();

    page.on('console', msg => {
        console.log(`[BROWSER CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
    });
    
    page.on('pageerror', error => {
        console.log(`[PAGE ERROR]: ${error.message}`);
    });
    
    page.on('requestfailed', request => {
        console.log(`[REQUEST FAILED]: ${request.url()} - ${request.failure().errorText}`);
    });

    console.log('Navigating to http://localhost:4000 ...');
    await page.goto('http://localhost:4000', { waitUntil: 'networkidle0' });
    
    console.log('Waiting 3 seconds...');
    await new Promise(r => setTimeout(r, 3000));
    
    const html = await page.content();
    console.log('Loaded HTML length:', html.length);
    if(html.includes('Loading facts...')) {
        console.log('STILL STUCK ON LOADING!');
    }
    
    await browser.close();
    console.log('Done.');
}
checkConsole().catch(console.error);
