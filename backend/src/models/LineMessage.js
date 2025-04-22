const mongoose = require('mongoose');

const LineMessageSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['text', 'image', 'template', 'flex'],
      required: true
    },
    content: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    title: {
      type: String
    },
    description: {
      type: String
    },
    isTemplate: {
      type: Boolean,
      default: false
    },
    trigger: {
      type: String,
      enum: ['order_created', 'order_processing', 'order_shipped', 'order_completed', 'manual'],
      default: 'manual'
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('LineMessage', LineMessageSchema); 