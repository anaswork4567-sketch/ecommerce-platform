const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Mock database - in memory
const products = [
  { id: 1, name: 'Laptop', price: 50000, stock: 10 },
  { id: 2, name: 'Phone', price: 20000, stock: 25 },
  { id: 3, name: 'Tablet', price: 15000, stock: 15 }
];

// GET all products
app.get('/products', (req, res) => {
  res.json(products);
});

// GET single product by ID
app.get('/products/:id', (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// CREATE new product
app.post('/products', (req, res) => {
  const newProduct = {
    id: Math.max(...products.map(p => p.id)) + 1,
    name: req.body.name,
    price: req.body.price,
    stock: req.body.stock
  };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

// UPDATE product
app.put('/products/:id', (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (!product) return res.status(404).json({ error: 'Product not found' });
  
  product.name = req.body.name || product.name;
  product.price = req.body.price || product.price;
  product.stock = req.body.stock || product.stock;
  
  res.json(product);
});

// DELETE product
app.delete('/products/:id', (req, res) => {
  const index = products.findIndex(p => p.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Product not found' });
  
  const deleted = products.splice(index, 1);
  res.json(deleted[0]);
});

// HEALTH CHECK
app.get('/health', (req, res) => {
  res.json({ 
    status: 'Product Service UP', 
    timestamp: new Date(),
    service: 'product-service'
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✓ Product Service running on http://localhost:${PORT}`);
  console.log(`✓ Test: curl http://localhost:${PORT}/health`);
});
