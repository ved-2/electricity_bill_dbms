const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const consumptionSchema = new Schema({
  meterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meter',
    required: true
  },
  readingDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  unitsUsed: {
    type: Number,
    required: true,
    min: 0
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
consumptionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Consumption = mongoose.model('Consumption', consumptionSchema);

module.exports = Consumption;