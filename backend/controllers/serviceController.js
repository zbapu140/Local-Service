const Service = require('../models/Service');
const Category = require('../models/Category');

//Get all services
const getServices = async (req, res) => {
  try {
    const services = await Service.find({ isAvailable: true })
      .populate('category', 'name')
      .populate('provider', 'name providerProfile');

    res.json({ data: services });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Get services by category
const getServicesByCategory = async (req, res) => {
  try {
    const services = await Service.find({ 
      category: req.params.categoryId,
      isAvailable: true 
    }).populate('provider', 'name providerProfile');

    res.json({ data: services });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Get services by provider
const getServicesByProvider = async (req, res) => {
  try {
    const services = await Service.find({ 
      provider: req.params.providerId,
      isAvailable: true 
    }).populate('category', 'name');

    res.json({ data: services });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Create a service
const createService = async (req, res) => {
  try {
    const { title, description, category, price, duration, location } = req.body;

    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const service = await Service.create({
      title,
      description,
      category,
      provider: req.user._id,
      price,
      duration,
      location,
    });

    res.status(201).json({ data: service, message: 'Service created successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Update service
const updateService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    if (service.provider.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updatedService = await Service.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    );

    res.json({ data: updatedService, message: 'Service updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Delete service
const deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    if (service.provider.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await service.deleteOne();
    res.json({ message: 'Service removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getServices,
  getServicesByCategory,
  getServicesByProvider,
  createService,
  updateService,
  deleteService,
};