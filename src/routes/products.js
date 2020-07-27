const express = require('express');
const ProductService = require('../services/products');

const router = express.Router();

router.get('/images-list', (req, res) => {
  ProductService.getImages(req, res);
});

router.get('/', (req, res) => {
  ProductService.getProducts(req, res);
});

router.get('/:id', (req, res) => {
  ProductService.getProduct(req, res);
});

router.put('/:id', (req, res) => {
  ProductService.updateProduct(req, res);
});

router.post('/', (req, res) => {
  ProductService.createProduct(req, res);
});

router.delete('/:id', (req, res) => {
  ProductService.deleteProduct(req, res);
});

module.exports = router;
