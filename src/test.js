import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import UserAgent from 'user-agents';
import fs from 'fs/promises';

// Use stealth plugin
puppeteer.use(StealthPlugin());

async function test() {


    const browser = await puppeteer.launch({
        headless: false,
        args: [
        '--start-maximized',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled'
        ],
        defaultViewport: null
    });

    const page = await browser.newPage();
    const userAgent = new UserAgent();
    await page.setUserAgent(userAgent.toString());

    await page.goto('https://www.amazon.ca/s?k=laptop');

    const selector = "div[data-component-type='s-search-result']";



    await page.waitForSelector(selector);
    const el = await page.$(selector);

    const text = await el.evaluate(e => e.innerHTML);
    
    browser.close();
    console.log(text);
}

test();
