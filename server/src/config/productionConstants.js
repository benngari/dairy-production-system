module.exports = {
  LABOUR_PER_BATCH: 335,
  MILK_COST_PER_LITRE: 55,
  SUGAR_PERCENT_OF_MILK: 0.06,
  SUGAR_COST_PER_KG: 178,
  STARCH_GRAMS_PER_LITRE: 5,
  STARCH_COST_PER_KG: 166,
  PECTIN_GRAMS_PER_LITRE: 1,
  PECTIN_COST_PER_GRAM: 5,
  CULTURE_LITRES_PER_SACHET: 500,
  CONSUMABLES_PERCENT: 0.05,
  FLAVOUR_ML_PER_15L: 5,
  COLOUR_ML_PER_15L: 15,
  // Single list every controller/model imports instead of hardcoding
  // ['Yoghurt', 'Mala'] in a dozen places — adding a future 4th product
  // only means changing this one line.
  PRODUCT_TYPES: ['Yoghurt', 'Mala', 'Kefir'],
  FLAVOUR_COLOUR_MAP: {
    'Mango': 'Annatto Colour',
    'Strawberry': 'Red Beet Colour',
    'Lemon Biscuit': 'Lutein',
    'Pineapple': 'Annatto Colour',
    'Vanilla': null
  },
  COLOUR_OPTIONS: ['Annatto Colour', 'Red Beet Colour', 'Lutein'],
  BOTTLE_LITRES: {
    '500ml': 0.5,
    '1L': 1,
    '2L': 2,
    '3L': 3,
    '5L': 5
  },
  BOTTLE_SIZES: ['500ml', '1L', '2L', '3L', '5L']
};