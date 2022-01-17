const express = require('express');
const path = require('path');

const productsController = require('../controllers/products');

const router = express.Router();

router.get('/add-product', productsController.getAddProduct); 

router.post('/add-product', productsController.postAddProduct);

module.exports = router;