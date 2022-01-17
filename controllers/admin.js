const Product = require('../models/product');

exports.getAddProduct = (req, res, next) => {
    res.render('admin/add-product', { 
        docTitle: "Add Product", 
        path: '/admin/add-product',
        productCSS: true,
        activeAddProduct: true
    });
};

exports.postAddProduct = (req, res, next) => {
    const tilte = req.body.title;
    const imageUrl = req.body.imageUrl;
    const price = req.body.price;
    const description = req.body.description;
    const product = new Product(tilte, imageUrl, price, description);
    product.save();
    res.redirect('/');
};

exports.getAdminProducts = (req, res, next) => {
    Product.fetchAll(products => {
        res.render('admin/products', {
            prods: products,
            docTitle: 'Admin Products',
            path: '/admin/products'
        });
    });
}