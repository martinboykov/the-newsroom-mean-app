const Category = require('../models/category');

const Fawn = require('Fawn');

// GET
const getCategories = async (req, res, next) => {
  const categories = await Category.find();
  res.status(200).json({
    message: 'Categories fetched successfully',
    categories: categories,
  });
};

const getCategorySubcategories = async (req, res, next) => {
  const subcategories = await Category
    .findOne({ _id: req.params._id })
    .select('subcategories')
    .populate('subcategories', 'name');
  res.status(200).json({
    message: `Subcategories of Category with _id: ${req.params._id} fetched successfully`, // eslint-disable-line max-len
    category: subcategories,
  });
};

const getCategoryPosts = async (req, res, next) => {
  const posts = await Category
    .findOne({ _id: req.params._id })
    .select('posts')
    .populate('posts');
  res.status(200).json({
    message: `Posts of Category with _id: ${req.params._id} fetched successfully`, // eslint-disable-line max-len
    category: posts,
  });
};

// POST
const addCategory = async (req, res, next) => {
  const category = new Category({ // mongo driver adds _id behind the scene,  before it is saved to MongoDB
    name: req.body.name,
    // subcategories: req.body.subcategories,
  });
  await category.save();
  res.status(201).json({
    message: 'Category added successfully', // not neccessary
    category: category,
  });
};

// PUT
const renameCategory = async (req, res, next) => {
  const category = await Category.findOne({ _id: req.params._id });
  // if no such exists =>
  // ...

  const task = new Fawn.Task(); // eslint-disable-line new-cap

  task.update('categories', {
    _id: category._id,
  }, {
      $set: { name: req.body.newName },
    });

  category.name = req.body.name;

  task.update('posts', {
    'category._id': category._id,
  }, {
      $set: { 'category.name': req.body.newName },
    }).options({ multi: true });

  task.run({ useMongoose: true })
    .then(() => {
      res.status(200).json({
        message: 'Category (and Post(s)) updated successfully',
        category: category,
      });
    })
    .catch((err) => {
      res.status(500).json({ message: 'Something failed.' });
      console.log(err);
    });

  // DELETE
  // ...
};

module.exports = {
  getCategories,
  getCategorySubcategories,
  getCategoryPosts,
  addCategory,
  renameCategory,
};
