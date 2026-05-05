const Category = require('../models/Category');

//Get all categories
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true });
    res.json({ data: categories });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Get single category
const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Create a category
const createCategory = async (req, res) => {
  try {
    const { name, description, icon } = req.body;

    const categoryExists = await Category.findOne({ name });
    if (categoryExists) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const category = await Category.create({
      name,
      description,
      icon: icon || '🛠️',
    });

    res.status(201).json({ data: category, message: 'Category created successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Update category
const updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (category) {
      category.name = req.body.name || category.name;
      category.description = req.body.description || category.description;
      category.icon = req.body.icon || category.icon;
      category.isActive = req.body.isActive !== undefined ? req.body.isActive : category.isActive;

      const updatedCategory = await category.save();
      res.json({ data: updatedCategory, message: 'Category updated successfully' });
    } else {
      res.status(404).json({ message: 'Category not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Delete category
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (category) {
      await category.deleteOne();
      res.json({ message: 'Category removed' });
    } else {
      res.status(404).json({ message: 'Category not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};