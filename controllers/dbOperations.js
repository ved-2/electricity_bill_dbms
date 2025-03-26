const Customer = require('../models/customers');
const Meter = require('../models/meters');
const Consumption = require('../models/consumption');
const Bill = require('../models/bills');

// Customer Operations
const addCustomer = async (customerData) => {
  try {
    const customer = new Customer(customerData);
    const savedCustomer = await customer.save();
    return savedCustomer;
  } catch (error) {
    throw error;
  }
};

// Meter Operations
const addMeter = async (meterData) => {
  try {
    const meter = new Meter(meterData);
    const savedMeter = await meter.save();
    return savedMeter;
  } catch (error) {
    throw error;
  }
};

// Consumption Operations
const addConsumption = async (consumptionData) => {
  try {
    const consumption = new Consumption(consumptionData);
    const savedConsumption = await consumption.save();
    return savedConsumption;
  } catch (error) {
    throw error;
  }
};

// Bill Operations
const addBill = async (billData) => {
  try {
    const bill = new Bill(billData);
    const savedBill = await bill.save();
    return savedBill;
  } catch (error) {
    throw error;
  }
};

// Example usage:
/*
// Add a new customer
const customerData = {
  name: "John Doe",
  address: "123 Main St",
  contactNumber: "1234567890",
  email: "john@example.com"
};

// Add a new meter
const meterData = {
  customerId: savedCustomer._id,
  meterNumber: "M123456",
  installationDate: new Date()
};

// Add consumption record
const consumptionData = {
  meterId: savedMeter._id,
  readingDate: new Date(),
  unitsUsed: 100
};
*/

module.exports = {
  addCustomer,
  addMeter,
  addConsumption,
  addBill
};
