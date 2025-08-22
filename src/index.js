import fs from "fs/promises";
import puppeteerExtra from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import UserAgent from "user-agents";
import { scraper } from "./scraper.js";
import { fetchBestBuyProducts } from "./bestBuy.js";

import puppeteerCore from "puppeteer-core";
import chromium from '@sparticuz/chromium';

puppeteerExtra.use(StealthPlugin());

async function scrapeSiteWithNewPage(browser, site, searchKeyword, numPerSite) {
  let page;
  try {
    page = await browser.newPage();

    const userAgent = new UserAgent();
    await page.setUserAgent(userAgent.toString());

    await page.setExtraHTTPHeaders({
      'accept-language': 'en-US,en;q=0.9',
      'accept-encoding': 'gzip, deflate, br',
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'upgrade-insecure-requests': '1',
      'sec-fetch-site': 'none',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-user': '?1',
      'sec-fetch-dest': 'document',
    });

    await page.setJavaScriptEnabled(true);
    await page.setViewport({ width: 1366, height: 768 });
    await page.emulateTimezone('America/Los_Angeles');

    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const blocked = ['']; // add types if you want to block images, fonts, etc.
      if (blocked.includes(req.resourceType())) req.abort();
      else req.continue();
    });

    // Wrap scraping in try/catch to prevent failures
    try {
      const products = await scraper(site, page, searchKeyword, numPerSite);
      return products || [];
    } catch (scrapeErr) {
      console.warn(`Scraping failed for ${site.site}: ${scrapeErr.message}`);
      return [];
    }

  } catch (err) {
    console.error(`Error setting up page for ${site.site}: ${err.message}`);
    return [];
  } finally {
    if (page && !page.isClosed()) {
      try {
        await page.close();
      } catch (closeErr) {
        console.warn(`Failed to close page for ${site.site}: ${closeErr.message}`);
      }
    }
  }
}


export async function main(searchKeyword, numPerSite, category) {
  console.log("-------------------------------")
  console.log("Searching for " + searchKeyword);

  const executablePath = await chromium.executablePath() || puppeteerCore.executablePath();

  const browser = await puppeteerCore.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });

  const sitesRaw = await fs.readFile(`${category}_website.json`, 'utf-8');
  const sites = JSON.parse(sitesRaw);

  // do best buy seperatlely
  const bestBuyPromise = fetchBestBuyProducts(searchKeyword, 1, numPerSite);

  // Sequential scraping to prevent browser crashes
  const scrapedProducts = [];
  for (const site of sites) {
    try {
      const siteProducts = await scrapeSiteWithNewPage(browser, site, searchKeyword, numPerSite);
      scrapedProducts.push(...siteProducts);
    } catch (err) {
      console.warn(`Failed scraping ${site.site}: ${err.message}`);
    }
  }
  
  // Fetch BestBuy separately
  const bestBuyProducts = await fetchBestBuyProducts(searchKeyword, 1, numPerSite);

  await browser.close();

  console.log('Done, browser closed.');

  const products = [...bestBuyProducts, ...scrapedProducts];

  console.log(`Found ${products.length} products. (unsorted)`);

  return products;
}











































