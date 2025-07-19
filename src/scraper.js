import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

import {
  autoScroll,
  isWrongProduct,
  getRealAmazonUrl,
  cleanProductName,
  cleanProductPrice,
  cleanProductRating,
  cleanProductReviewCount
} from "./utils.js";

puppeteer.use(StealthPlugin());


export async function scraper(site, page, searchKeyword, numPerSite) {
  console.time(site.site);

  const encodedKeyword = encodeURIComponent(searchKeyword);
  let currentPageUrl = site.url.replaceAll("{query}", encodedKeyword);
  let products = [];

  while (products.length < numPerSite && currentPageUrl) {
    try {
      await page.goto(currentPageUrl, { waitUntil: 'domcontentloaded' });
    } catch (error) {
      console.error(`Failed to load ${site.site}:`, error.message);
      break;
    }

    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });
    });

    try {
      await page.waitForSelector(site.selectors.productContainer, { timeout: 5000 });
    } catch (err) {
      console.log(`Selector ${site.site} product monkey container not found.`);
      break;
    }

    await autoScroll(page);

    const productHandles = await page.$$(site.selectors.productContainer);

    for (const item of productHandles) {
      if (products.length >= numPerSite) break;

      const getText = async (selector) => {
        if (!selector) return '';
        const el = await item.$(selector);
        return el ? (await item.$eval(selector, el => el.textContent.trim())) : '';
      };

      const getAttr = async (selector, attr) => {
        if (!selector) return '';
        const el = await item.$(selector);
        return el ? (await el.evaluate((el, attrName) => el.getAttribute(attrName), attr)) : '';
      };

      let name = await getText(site.selectors.name);
      let price = await getText(site.selectors.price);
      let image = await getAttr(site.selectors.image, 'src');
      let url = await getAttr(site.selectors.link, 'href');
      let rating = await getText(site.selectors.rating);
      let reviewCount = await getText(site.selectors.reviewCount);

      if (isWrongProduct(name) || isWrongProduct(price) || isWrongProduct(url)
          || !name || !price || !url) {
        continue;
      }

      name = cleanProductName(name);
      price = cleanProductPrice(price);
      if (typeof rating === 'string') {
        rating = cleanProductRating(rating);
      }
      reviewCount = cleanProductReviewCount(reviewCount);

      if (site.site === 'Amazon' && url) {
        url = getRealAmazonUrl(url);
      }

      const product = { name, price, image, url, rating, reviewCount };
      products.push(product);
    }

    // Find next page URL if available
    if (site.selectors.nextPageSelector) {
      const nextPageLink = await page.$eval(site.selectors.nextPageSelector, el => el.href).catch(() => null);
      if (nextPageLink && nextPageLink !== currentPageUrl) {
        currentPageUrl = nextPageLink;
      } else {
        break; // no next page or repeated URL
      }
    } else {
      break; // no nextPageSelector defined
    }
  }
  console.timeEnd(site.site);
  return products;
}
