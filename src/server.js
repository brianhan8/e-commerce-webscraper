import express from 'express';
import cors from 'cors';
import { main } from './index.js';

import fs from "fs/promises";

console.log("--------------------");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.post('/api/scrape', async (req, res) => {
  let { searchKeyword, numPerSite } = req.body;

  try {
    if (!searchKeyword || !numPerSite) {
      return res.status(400).json({ error: 'Missing searchKeyword or numPerSite' });
    }

    // Run scraper and get the data
    numPerSite = 25;
    const products = await main(searchKeyword, numPerSite);

    try { // write product file
        await fs.writeFile('products.json', JSON.stringify(products, null, 2));
        console.log('Products JSON file written successfully.');
    } catch (error) {
        console.error('Error writing products JSON file:', error);
    }

    // Send the scraped products and sorting indices back to client    
    res.json(products);

  } catch (error) {
    console.error('Scraper error:', error);
    res.status(500).json({ error: 'Scraper failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
