import mongoose from 'mongoose';
import dotenv from "dotenv";
dotenv.config();

import express from 'express';
import cors from 'cors';
import { main } from './index.js';
import saveProductRouter from './saveProduct.js';
import { sort } from "./sort.js";
import { getAllSaved } from './utils.js';
import { notifyUser, sendAvg } from './utils.js';
import { filter } from './sort.js';
import fs from "fs/promises";

import updateTokenRouter from './updateToken.js';
import updateProductRouter from './updateProduct.js';
import deleteProductRouter from './deleteProduct.js';

import SavedProduct from './SavedProduct.js';

console.log("--------------------");

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Update device token
app.use('/api', updateTokenRouter);

// save product
app.use('/api/save-product', saveProductRouter);

// update product
app.use('/api/update-product', updateProductRouter);

// delete product
app.use('/api/delete-product', deleteProductRouter);

// get products for a saved query
app.get('/api/products/:queryId', async (req, res) => {
  const queryId = req.params.queryId;

  try {
    const products = JSON.parse(await fs.readFile('products.json', 'utf-8'));
    
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// scrape products
import cron from 'node-cron';

cron.schedule('0 8 * * *', () => {
  console.log('Starting scheduled scrapes for all saved queries...');
  runScrapes();
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});


async function runScrapes() {
  const savedQueries = await getAllSaved();

  for (const query of savedQueries) {
    let includeKeywords = query.includeKeywords;
    let exclude = query.excludeKeywords || [];
    let minPrice = query.minPrice || 0;
    let maxPrice = query.maxPrice || Infinity;
    let category = query.category;
    let token = query.token;

    if (typeof exclude === 'string') {
      exclude = exclude.split(',').map(s => s.trim()).filter(s => s.length > 0);
    }
    console.log(`Running scrape for query: ${includeKeywords}, Exclude: ${exclude.join(', ')}, Min Price: ${minPrice}, Max Price: ${maxPrice}, Category: ${category}`);

    try {
      let products = await main(includeKeywords, 25, category);

      // filter products with excludeKeywords, minPrice, maxPrice here
      products = filter(products, {
      minPrice,
      maxPrice,
      includeKeyword: includeKeywords,
      excludeKeywords: exclude
    });
      
      // Save or compare products, check if there are new matches for this query
      products = await sort(products);

      if (products.length === 0) {
        console.log(`No products found for query: ${includeKeywords}`);
      }
      else {
        console.log(`Found ${products.length} products. (sorted)`);
      }

      // raw products
      try {
          await fs.writeFile('rawProducts.json', JSON.stringify(products, null, 2));
          console.log('✅ rawProducts.json written successfully.');
      } catch (err) {
          console.error('❌ Error writing file:', err);
      }

      if (products.length > 0) {
        sendAvg(query, token, products);
      }


      // --- filter out already sent URLs ---
      const sentProducts = query.sentProducts || [];
      products = products.filter(p => 
        !sentProducts.some(sp => sp.name === p.name && sp.price === p.price)
      );

      if (products.length > 0) {
          console.log(`✅ ${products.length} new products to send to Android.`);

          // Update with these URLs so they no send again
          const productsToAdd = products.map(p => ({ name: p.name, price: p.price }));
          await SavedProduct.updateOne(
            { _id: query._id },
            { $addToSet: { sentProducts: { $each: productsToAdd } } }
          );

      } else {
        console.log('No new products to notify (all URLs already sent).');
      }

      if (products.length > 0) {
        // Notify user about new products for this query
        notifyUser(query, products.length, token);
        
        // write json
        try {
          await fs.writeFile('products.json', JSON.stringify(products, null, 2));
          console.log('✅ products.json written successfully.');
        } catch (err) {
          console.error('❌ Error writing file:', err);
        }
      }
    } catch (error) {
      console.error(`Scrape failed for query ${query.includeKeywords}`, error);
    }
  }
}


