const { Product } = require('../db/models');
const config = require('../config');
const fs = require('fs');
const path = require('path');

module.exports = class ProductService {
  static getImages (req, res) {
    fs.readdir(path.resolve(process.env.PWD + '/public/assets/products/'), (err, files) => {
      files = files.filter(item => !(/(^|\/)\.[^\/\.]/g).test(item)).map(f => config.remote + '/assets/products/' + f);
      res.json(files);
    });
  }

  static getProducts (req, res) {
    Product.findAll().then(products => {
      res.json(products);
    })
  }

  static getProduct (req, res) {
    Product.findByPk(req.params.id).then(product => {
      res.json(product);
    })
  }

  static updateProduct (req, res) {
    Product.update(req.body, {where: {id: req.params.id}, returning: true, plain: true}).then(([, model]) => {
      res.json(model.dataValues);
    })
  }

  static createProduct (req, res) {
    let product = req.body;
    if (product.id) {
        delete product.id;
    }
    Product.create(req.body).then(product => {
        res.json(product);
    })
  }

  static deleteProduct (req, res) {
    Product.destroy({where: {id: req.params.id}}).then(response => {
      res.json(response);
    })
  }
}
