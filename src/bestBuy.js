// bestbuyClient.js
import fetch from 'node-fetch';

/**
 * Fetch product data from BestBuy.ca internal API
 * @param {string} query - Search term (e.g., "laptop")
 * @param {number} page - Page number (default 1)
 * @param {number} maxResults - Max number of products to return (optional)
 * @returns {Promise<Array>} Array of product objects
 */
export async function fetchBestBuyProducts(query = "laptop", page = 1, maxResults = 20) {
  const url = `https://www.bestbuy.ca/api/v2/json/search?query=${encodeURIComponent(query)}&page=${page}`;
  const res = await fetch(url);

  console.time("best buy");
  console.log("Scraping site: BestBuy");
  

  if (!res.ok) {
    throw new Error(`Failed to fetch BestBuy products: ${res.status}`);
  }

  const data = await res.json();
  if (!data.products) return [];

  const products = data.products.slice(0, maxResults).map(p => ({
    name: p.name,
    price: p.salePrice || p.regularPrice,
    image: p.highResImage || p.thumbnailImage || null,
    url: `https://www.bestbuy.ca${p.productUrl}`,
    rating: p.customerRating,
    reviewCount: p.customerReviewCount
  }));

  console.timeEnd("best buy");
  return products;
}
