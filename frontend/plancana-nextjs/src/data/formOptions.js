// Agricultural form options and suggestions
// Data sourced from malaysia_crops_450.csv

// Crop type options
export const cropTypeOptions = [
  { value: 'fruit', label: 'Fruit' },
  { value: 'vegetable', label: 'Vegetable' },
  { value: 'cash-crop', label: 'Cash Crop' },
  { value: 'herb-spice', label: 'Herb/Spice' },
  { value: 'industrial-crop', label: 'Industrial Crop' }
];

// Organized crop data by crop type and product
export const cropOptions = [
  // Fruits
  { value: 'banana', label: 'Banana', cropType: 'fruit', varieties: ['Pisang Berangan', 'Pisang Emas', 'Pisang Cavendish', 'Pisang Raja', 'Pisang Nangka', 'Pisang Abu', 'Pisang Tanduk', 'Pisang Rastali'] },
  { value: 'durian', label: 'Durian', cropType: 'fruit', varieties: ['D197 Musang King', 'D24', 'D101', 'Udang Merah', 'XO', 'Tekka', 'Kampung'] },
  { value: 'mango', label: 'Mango', cropType: 'fruit', varieties: ['Harumanis', 'Chokanan', 'Sala', 'Nam Dok Mai', 'Golden Lily', 'Lurpak'] },
  { value: 'papaya', label: 'Papaya', cropType: 'fruit', varieties: ['Eksotika I', 'Eksotika II', 'Hawaii', 'Sekaki'] },
  { value: 'pineapple', label: 'Pineapple', cropType: 'fruit', varieties: ['MD2', 'N36', 'Moris', 'Josapine', 'Gandul', 'Sarawak'] },

  // Vegetables
  { value: 'sawi', label: 'Sawi', cropType: 'vegetable', varieties: ['Sawi Bunga', 'Sawi Hijau', 'Sawi Paichai', 'Sawi Taiwan'] },
  { value: 'kangkung', label: 'Kangkung', cropType: 'vegetable', varieties: ['Kangkung Darat', 'Kangkung Air'] },
  { value: 'kailan', label: 'Kailan', cropType: 'vegetable', varieties: ['Kailan Lokal', 'Kailan Taiwan'] },
  { value: 'bayam', label: 'Bayam', cropType: 'vegetable', varieties: ['Bayam Hijau', 'Bayam Merah', 'Bayam Brazil'] },
  { value: 'cili', label: 'Cili', cropType: 'vegetable', varieties: ['Cili Merah', 'Cili Hijau', 'Cili Padi', 'Cili Bara'] },
  { value: 'terung', label: 'Terung', cropType: 'vegetable', varieties: ['Terung Ungu', 'Terung Putih', 'Terung Panjang', 'Terung Bulat'] },

  // Cash Crops
  { value: 'cassava', label: 'Cassava', cropType: 'cash-crop', varieties: ['Ubi Kayu Putih', 'Ubi Kayu Kuning', 'Ubi Kayu Merah'] },
  { value: 'sweet-potato', label: 'Sweet Potato', cropType: 'cash-crop', varieties: ['Keledek Oren', 'Keledek Ungu', 'Keledek Putih'] },
  { value: 'yam', label: 'Yam', cropType: 'cash-crop', varieties: ['Keladi Cina', 'Keladi Kampung', 'Keladi Hitam'] },
  { value: 'sugarcane', label: 'Sugarcane', cropType: 'cash-crop', varieties: ['Tebu Hitam', 'Tebu Kuning', 'Tebu Cina'] },

  // Herbs & Spices
  { value: 'ginger', label: 'Ginger', cropType: 'herb-spice', varieties: ['Halia Bara', 'Halia Bentong', 'Halia Tua', 'Halia Merah'] },
  { value: 'turmeric', label: 'Turmeric', cropType: 'herb-spice', varieties: ['Kunyit Hidup', 'Kunyit Putih', 'Kunyit Hitam'] },
  { value: 'pandan', label: 'Pandan', cropType: 'herb-spice', varieties: ['Pandan Wangi', 'Pandan Serani'] },
  { value: 'serai', label: 'Serai', cropType: 'herb-spice', varieties: ['Serai Wangi', 'Serai Kampung'] },

  // Industrial Crops
  { value: 'coconut', label: 'Coconut', cropType: 'industrial-crop', varieties: ['Matag', 'Malayan Tall', 'Malayan Dwarf', 'Kelapa Pandan'] },
  { value: 'coffee', label: 'Coffee', cropType: 'industrial-crop', varieties: ['Liberica', 'Robusta', 'Arabica'] },
  { value: 'tea', label: 'Tea', cropType: 'industrial-crop', varieties: ['Assamica', 'Sinensis'] },
  { value: 'oil-palm', label: 'Oil Palm', cropType: 'industrial-crop', varieties: ['DxP Hybrid', 'Tenera'] }
];

export const seedsSourceOptions = [
  'Local Seed Bank',
  'Certified Seed Company',
  'Government Agricultural Department',
  'Cooperative Society',
  'Private Dealer',
  'Online Seed Store',
  'Self-Saved Seeds',
  'Research Institution',
  'International Seed Company',
  'Organic Seed Supplier'
];

export const fertilizerOptions = [
  'Urea',
  'NPK (Nitrogen, Phosphorus, Potassium)',
  'Diammonium Phosphate (DAP)',
  'Potassium Chloride',
  'Ammonium Sulfate',
  'Organic Compost',
  'Vermicompost',
  'Bio-fertilizer',
  'Liquid Fertilizer',
  'Slow Release Fertilizer',
  'Bone Meal',
  'Fish Emulsion',
  'Seaweed Extract'
];

export const pesticideOptions = [
  'Neem Oil',
  'Pyrethrin',
  'Bacillus thuringiensis (Bt)',
  'Copper Sulfate',
  'Diatomaceous Earth',
  'Insecticidal Soap',
  'Horticultural Oil',
  'Beneficial Insects',
  'Pheromone Traps',
  'Organic Fungicide',
  'Systemic Insecticide',
  'Contact Herbicide',
  'Selective Herbicide'
];

export const locationSuggestions = [
  'Punjab, Pakistan',
  'Sindh, Pakistan', 
  'Khyber Pakhtunkhwa, Pakistan',
  'Balochistan, Pakistan',
  'Gilgit-Baltistan, Pakistan',
  'Azad Kashmir, Pakistan',
  'Islamabad Capital Territory, Pakistan',
  // Add more as needed
];

export const commonLocations = [
  'Lahore District',
  'Karachi District',
  'Faisalabad District',
  'Rawalpindi District',
  'Gujranwala District',
  'Peshawar District',
  'Multan District',
  'Hyderabad District',
  'Quetta District',
  'Sialkot District'
];

export const unitOptions = [
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'tons', label: 'Metric Tons' },
  { value: 'lbs', label: 'Pounds (lbs)' },
  { value: 'bushels', label: 'Bushels' },
  { value: 'bags', label: 'Bags (50kg each)' },
  { value: 'crates', label: 'Crates' },
  { value: 'boxes', label: 'Boxes' }
];

export const qualityGradeOptions = [
  { value: 'premium', label: 'Premium Grade (A+)' },
  { value: 'grade-a', label: 'Grade A' },
  { value: 'grade-b', label: 'Grade B' },
  { value: 'grade-c', label: 'Grade C' },
  { value: 'export-quality', label: 'Export Quality' },
  { value: 'domestic', label: 'Domestic Quality' },
  { value: 'organic-certified', label: 'Organic Certified' },
  { value: 'fair-trade', label: 'Fair Trade Certified' }
];

export const cultivationMethodOptions = [
  { value: 'organic', label: 'Organic Farming' },
  { value: 'conventional', label: 'Conventional Farming' },
  { value: 'hydroponic', label: 'Hydroponic System' },
  { value: 'sustainable', label: 'Sustainable Agriculture' },
  { value: 'permaculture', label: 'Permaculture' },
  { value: 'biodynamic', label: 'Biodynamic Farming' },
  { value: 'precision', label: 'Precision Agriculture' },
  { value: 'greenhouse', label: 'Greenhouse Cultivation' }
];

export const irrigationMethodOptions = [
  { value: 'drip', label: 'Drip Irrigation' },
  { value: 'sprinkler', label: 'Sprinkler System' },
  { value: 'flood', label: 'Flood Irrigation' },
  { value: 'furrow', label: 'Furrow Irrigation' },
  { value: 'pivot', label: 'Center Pivot' },
  { value: 'micro-spray', label: 'Micro-spray' },
  { value: 'subsurface', label: 'Subsurface Irrigation' },
  { value: 'rainwater', label: 'Rainwater Harvesting' }
];

export const certificationOptions = [
  'Organic Certified',
  'Halal Certified',
  'MyGAP (Malaysian Good Agricultural Practice)',
  'GLOBALG.A.P',
  'Fair Trade Certified',
  'Rainforest Alliance',
  'HACCP (Food Safety)',
  'ISO 22000 (Food Safety Management)',
  'Non-GMO Verified',
  'Pesticide Free',
  'EU Organic Certification',
  'USDA Organic',
  'MSC (Marine Stewardship Council)',
  'ASC (Aquaculture Stewardship Council)',
  'UTZ Certified',
  'Bird Friendly',
  'Carbon Neutral',
  'Vegan Certified',
  'None',
  'Other (specify)'
];