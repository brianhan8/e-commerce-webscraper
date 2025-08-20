import mongoose from 'mongoose';

const SavedProductSchema = new mongoose.Schema({
  includeKeywords: { type: String, required: true },
  excludeKeywords: { type: [String], default: [] },
  minPrice: { type: Number, default: 0 },
  maxPrice: { type: Number, required: true },
  category: { type: String, required: true },
  sentProducts: {
    type: [
      {
        name: String,
        price: Number
      }
    ],
    default: []
  },
  timestamp: { type: Date, default: Date.now },
  token: { type: String }
});

const SavedProduct = mongoose.models.SavedProduct || mongoose.model('SavedProduct', SavedProductSchema);
export default SavedProduct;
