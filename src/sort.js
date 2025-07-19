import fs from 'fs/promises';

export async function sort(products) {
  try {
    // Read original products
    const sortingIndices = {};

    // 0 = Best value (Combine price / rating and rating (rating * reviewCount))
    sortingIndices[0] = [...products]
      .map((p, i) => ({ index: i, value: 0.7 * (p.rating / p.price) + 0.3 * (p.rating * p.reviewCount) }))
      .sort((a, b) => b.value - a.value)
      .map(obj => obj.index);

    // 1 = Sort by lowest price
    sortingIndices[1] = [...products]
      .map((p, i) => ({ index: i, value: p.price }))
      .sort((a, b) => a.value - b.value)
      .map(obj => obj.index);

    // 2 = Sort by highest price
    sortingIndices[2] = [...products]
      .map((p, i) => ({ index: i, value: p.price }))
      .sort((a, b) => b.value - a.value)
      .map(obj => obj.index);

    // 3 = Sort by rating
    sortingIndices[3] = [...products]
      .map((p, i) => ({ index: i, value: p.rating * p.reviewCount }))
      .sort((a, b) => b.value - a.value)
      .map(obj => obj.index);

    // 4 = Sort by popularity (its just reviewCount)
    sortingIndices[4] = [...products]
      .map((p, i) => ({ index: i, value: p.reviewCount }))
      .sort((a, b) => b.value - a.value)
      .map(obj => obj.index);

    // Write new JSON structure
    const finalOutput = {
      products,
      sortingIndices
    };

    console.log("Products sorted and returned");
    return finalOutput;
  } catch (err) {
    console.error('Error generating sorted indices:', err);
  }
}