const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Invoice = require('../models/Invoice');

router.get('/', async (req, res) => {
  try {
    const totalCustomers = await Customer.countDocuments();
    const totalInvoices = await Invoice.countDocuments();
    const invoices = await Invoice.find();
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const recentCustomers = await Customer.find().sort({ createdAt: -1 }).limit(3);
    const recentInvoices = await Invoice.find().sort({ createdAt: -1 }).limit(3);

    res.json({
      totalCustomers,
      totalInvoices,
      totalRevenue,
      recentCustomers,
      recentInvoices,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;