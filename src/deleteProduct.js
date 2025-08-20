import express from 'express';
import SavedProduct from './SavedProduct.js';

const router = express.Router();

router.delete('/', async (req, res) => {
  const source = req.header('X-Source');
  if (source !== 'android') {
    return res.status(200).json({ message: 'Skipped delete (not from Android)' });
  }

  const { id, token } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Missing product id for deletion' });
  }

  try {
    // Optionally, you can verify token here to authenticate request

    const deletedProduct = await SavedProduct.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res.status(404).json({ error: 'Product not found for deletion' });
    }

    console.log('✅ Product DELETED successfully:', deletedProduct);

    return res.status(200).json({
      message: 'Product deleted successfully',
      deletedProductId: deletedProduct._id.toString()
    });

  } catch (error) {
    console.error('❌ Error deleting product:', error);
    return res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;
