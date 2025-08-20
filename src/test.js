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
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36');

    await page.goto('https://www.newegg.ca/p/pl?d=laptop');

    let selector = 'div.item-container';
    // if (await page.$('.swipeout')) {
    //     selector = '.swipeout';
    // } else if (await page.$('.item-cell')) {
    //     selector = '.item-cell';
    // } else {
    // throw new Error('No product container found!');
    // }

    await page.waitForSelector(selector);
    const el = await page.$(selector);

    const text = await el.evaluate(e => e.innerHTML);
    
    browser.close();
    console.log(text);
}

test();
