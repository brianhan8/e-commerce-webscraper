import fs from 'fs/promises';
import dotenv from 'dotenv';
dotenv.config();

export async function autoScroll(page, maxScrolls = 2) {
  let previousHeight = await page.evaluate(() => document.body.scrollHeight);
  for (let i = 0; i < maxScrolls; i++) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    let newHeight = await page.evaluate(() => document.body.scrollHeight);
    if (newHeight === previousHeight) break;
    previousHeight = newHeight;
  }
}

export async function goToNextPage(page, nextPageSelector) {
  try {
    await page.waitForSelector(nextPageSelector, { timeout: 3000 });
    const isDisabled = await page.$eval(nextPageSelector, btn => btn.disabled || btn.classList.contains('disabled'));
    if (isDisabled) {
      return false; // No next page or disabled
    }
    await Promise.all([
      page.click(nextPageSelector),
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }),
    ]);
    return true;
  } catch (err) {
    // next page button not found or timeout
    return false;
  }
}

let wrongProducts = await fs.readFile('wrongProducts.json', 'utf-8');
export function isWrongProduct(name) {
    if (!name) return false;
    return wrongProducts.includes(name);
}

export function getRealAmazonUrl(redirectUrl) {
  return 'https://www.amazon.ca' + redirectUrl;
}

export function cleanProductName(name) {
  name = name.replace(/\u00A0/g, '').replace(/[–\-]+$/, '').trim(); // no weird ––– with organge trump thing
  return name;
}
export function cleanProductPrice(price) {
  price = price.replace(/\u00A0/g, '').replace(/[–\-]+$/, '').trim();
  price = price.replace(/[^0-9.,]/g, '').trim(); // no C or dolla sign
  if (price.indexOf(',') > -1) {
      price = price.replace(/,/g, ''); // replace , with nothing
  }

  price = parseFloat(price);
  
  return price;
}
export function cleanProductRating(rating) {
  rating = rating.replace(/\u00A0/g, '').trim();
  let match = rating.match(/[\d.]+/);
  rating = match ? parseFloat(match[0]) : null;

  return rating;
}
export function cleanProductReviewCount(reviewCount) {
  reviewCount = reviewCount.replace(/\u00A0/g, '').trim();
  reviewCount = reviewCount.replace(/[^0-9]/g, '');
  reviewCount = parseInt(reviewCount, 10);

  return reviewCount;
}

import SavedProduct from './SavedProduct.js';

export async function getAllSaved() {
  return await SavedProduct.find({});
}

import admin from 'firebase-admin';
const keyPath = process.env.FIREBASE_KEY_PATH;
const serviceAccount = JSON.parse(await fs.readFile(keyPath, 'utf-8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export async function notifyUser(query, newCount, token) {
  console.log("Token:" + token);

  console.log("Sending notification for savedProductId:", query._id?.toString());

  const message = {
    token: token,
    data: {
      savedProductId: query._id.toString(),
      includeKeywords: query.includeKeywords || '',
      newCount: newCount.toString()
    },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('✅ Notification sent:', response);
  } catch (error) {
    console.error('❌ Error sending notification:', error);
    if (error.code === 'messaging/registration-token-not-registered') {
    console.warn(`⚠️ Invalid token detected, deleting all saved items for token: ${token}`);

    // Delete all saved items tied to this token
    await SavedProduct.deleteMany({ token: token });
  }
  }
}

export async function sendAvg(query, token, products) {
  // Calculate overall average price
  const validPrices = products
      .map(p => p.price)
      .filter(p => typeof p === 'number');

  const averagePrice = validPrices.reduce((sum, p) => sum + p, 0) / validPrices.length;

  // Send only the average price as a number to Android
  const message = {
    token: token,
    data: {
      savedProductId: query._id.toString(),
      averagePrice: averagePrice.toString(), // must be string for FCM data payload
    },
  };
  
    try {
      const response = await admin.messaging().send(message);
      console.log('✅ Notification sent:', response);
    } catch (error) {
      console.error('❌ Error sending notification:', error);
      if (error.code === 'messaging/registration-token-not-registered') {
        console.warn(`⚠️ Invalid token detected, deleting all saved items for token: ${token}`);

        // Delete all saved items tied to this token
        await SavedProduct.deleteMany({ token: token });
      }

    console.log(`✅ Sent average price ${averagePrice} to Android.`);
  }
}
