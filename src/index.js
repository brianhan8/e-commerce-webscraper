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
  const page = await browser.newPage();

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
    // const blocked = ['image', 'stylesheet', 'font', 'media'];
    const blocked = [''];
    if (blocked.includes(req.resourceType())) {
      req.abort();
    } else {
      req.continue();
    }
  });

  const products = await scraper(site, page, searchKeyword, numPerSite);

  await page.close();

  return products || [];
} catch (err) {
    console.warn(`Error scraping ${site.site}:`, err.message);
    return [];
  } finally {
    if (!page.isClosed()) await page.close();
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



  // Flatten the array of arrays into a single array
  const scrapedProducts = scrapedProductsArrays.flat();

  await browser.close();

  console.log('Done, browser closed.');

  const products = [...bestBuyProducts, ...scrapedProducts];

  console.log(`Found ${products.length} products. (unsorted)`);

  return products;
}







































