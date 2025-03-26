const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const meterSchema = new Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  meterNumber: {
    type: String,
    required: true,
    unique: true
  },
  installationDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
meterSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Meter = mongoose.model('Meter', meterSchema);

module.exports = Meter;