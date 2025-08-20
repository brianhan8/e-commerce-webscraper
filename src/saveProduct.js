import express from 'express';
import SavedProduct from './SavedProduct.js';
import mongoose from 'mongoose';

const mongoUrl = process.env.MONGO_URI;

mongoose.connect(mongoUrl)
.then(() => console.log('✅ Connected to MongoDB'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

const router = express.Router();

router.post('/', async (req, res) => {
  const source = req.header('X-Source');
  if (source !== 'android') {
    return res.status(200).json({ message: 'Skipped saving (not from Android)' });
  }

  const { includeKeywords, excludeKeywords, minPrice, maxPrice, category, token } = req.body;

  try {
    // Create new product
      const newProduct = new SavedProduct({
        includeKeywords,
        excludeKeywords,
        minPrice,
        maxPrice,
        category,
        token,
        timestamp: Date.now()
      });
      await newProduct.save();
      console.log('✅ Product created successfully:', newProduct);
      return res.status(201).json({
        message: 'Product created successfully',
        savedProductId: newProduct._id.toString() // return MongoDB _id
      });
      
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to save or update product' });
  }
});



export default router;
