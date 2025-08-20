import express from 'express';
import SavedProduct from './SavedProduct.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const source = req.header('X-Source');
  if (source !== 'android') {
    return res.status(200).json({ message: 'Skipped update (not from Android)' });
  }

  const { id, includeKeywords, excludeKeywords, minPrice, maxPrice, token } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Missing product id for update' });
  }

  try {
    // Update the product by _id
    const updatedProduct = await SavedProduct.findByIdAndUpdate(
      id,
      {
        includeKeywords,
        excludeKeywords,
        minPrice,
        maxPrice,
        token,
        timestamp: Date.now()
      },
      { new: true } // return the updated document
    );

    if (!updatedProduct) {
      return res.status(404).json({ error: 'Product not found for update' });
    }

    console.log('✅ Product UPDATED successfully:', updatedProduct);

    return res.status(200).json({
      message: 'Product updated successfully',
      savedProductId: updatedProduct._id.toString()
    });

  } catch (error) {
    console.error('❌ Error updating product:', error);
    return res.status(500).json({ error: 'Failed to update product' });
  }
});

export default router;