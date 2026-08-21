export interface CatalogItem {
  name: string
  aliases: string
  unit: string
  price: number
  stock: boolean
}

export const FULL_CATALOG: CatalogItem[] = [
  { name: "Aashirvaad Atta 5kg", aliases: "atta, gehu ka atta", unit: "bag", price: 275, stock: true },
  { name: "India Gate Basmati Rice 1kg", aliases: "basmati chawal", unit: "kg", price: 120, stock: true },
  { name: "Sona Masoori Rice 5kg", aliases: "chawal", unit: "bag", price: 320, stock: true },
  { name: "Toor Dal 1kg", aliases: "arhar dal, tuvar dal", unit: "kg", price: 160, stock: true },
  { name: "Moong Dal 1kg", aliases: "green dal", unit: "kg", price: 130, stock: true },
  { name: "Chana Dal 1kg", aliases: "bengal gram", unit: "kg", price: 95, stock: true },
  { name: "Urad Dal 1kg", aliases: "black gram dal", unit: "kg", price: 140, stock: false },
  { name: "Fortune Sunflower Oil 1L", aliases: "fortune tel, sunflower oil", unit: "bottle", price: 165, stock: true },
  { name: "Saffola Gold Oil 1L", aliases: "saffola tel", unit: "bottle", price: 210, stock: true },
  { name: "Amul Ghee 500g", aliases: "desi ghee", unit: "jar", price: 300, stock: true },
  { name: "Tata Salt 1kg", aliases: "namak", unit: "packet", price: 28, stock: true },
  { name: "Sugar 1kg", aliases: "chini, cheeni", unit: "kg", price: 45, stock: true },
  { name: "Surf Excel 500g", aliases: "surf excel chota wala", unit: "packet", price: 45, stock: true },
  { name: "Surf Excel 1kg", aliases: "surf excel bada wala", unit: "packet", price: 85, stock: true },
  { name: "Ariel Detergent 1kg", aliases: "ariel powder", unit: "packet", price: 150, stock: true },
  { name: "Vim Dishwash Bar", aliases: "vim bar", unit: "piece", price: 10, stock: true },
  { name: "Vim Dishwash Liquid 500ml", aliases: "vim liquid", unit: "bottle", price: 95, stock: true },
  { name: "Lifebuoy Soap", aliases: "lifebuoy nahane ka sabun", unit: "piece", price: 35, stock: true },
  { name: "Dettol Soap", aliases: "dettol sabun", unit: "piece", price: 40, stock: false },
  { name: "Colgate Toothpaste 100g", aliases: "colgate paste", unit: "tube", price: 55, stock: true },
  { name: "Maggi Noodles 70g", aliases: "maggi, maggie", unit: "piece", price: 14, stock: true },
  { name: "Parle-G Biscuit 200g", aliases: "parle g", unit: "packet", price: 20, stock: true },
  { name: "Britannia Good Day 100g", aliases: "good day biscuit", unit: "packet", price: 30, stock: true },
  { name: "Marie Gold Biscuit 250g", aliases: "marie biscuit", unit: "packet", price: 35, stock: true },
  { name: "Tata Tea Gold 500g", aliases: "chai patti, tea patti", unit: "packet", price: 260, stock: true },
  { name: "Nescafe Classic Coffee 50g", aliases: "coffee", unit: "jar", price: 165, stock: true },
  { name: "Amul Milk 500ml", aliases: "doodh", unit: "packet", price: 27, stock: true },
  { name: "Amul Toned Milk 1L", aliases: "doodh 1 litre", unit: "packet", price: 54, stock: true },
  { name: "Amul Butter 100g", aliases: "makhan", unit: "pack", price: 56, stock: true },
  { name: "Britannia Cheese Slices", aliases: "cheese", unit: "pack", price: 120, stock: false },
  { name: "Haldiram Bhujia 200g", aliases: "bhujia, namkeen", unit: "packet", price: 55, stock: true },
  { name: "Lays Chips", aliases: "chips, lays", unit: "packet", price: 20, stock: true },
  { name: "Kurkure", aliases: "kurkure", unit: "packet", price: 20, stock: true },
  { name: "MDH Garam Masala 100g", aliases: "garam masala", unit: "packet", price: 85, stock: true },
  { name: "Turmeric Powder 200g", aliases: "haldi", unit: "packet", price: 45, stock: true },
  { name: "Red Chilli Powder 200g", aliases: "lal mirch", unit: "packet", price: 60, stock: true },
  { name: "Coriander Powder 200g", aliases: "dhania powder", unit: "packet", price: 40, stock: true },
  { name: "Onion 1kg", aliases: "pyaz", unit: "kg", price: 35, stock: true },
  { name: "Potato 1kg", aliases: "aloo", unit: "kg", price: 25, stock: true },
  { name: "Tomato 1kg", aliases: "tamatar", unit: "kg", price: 30, stock: false },
]
