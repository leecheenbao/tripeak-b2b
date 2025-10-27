const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    lineId: {
      type: String,
      required: true,
      unique: true
    },
    currentState: {
      type: String,
      enum: ['idle', 'waiting_order_number', 'waiting_product_query', 'waiting_stock_query', 'in_conversation'],
      default: 'idle'
    },
    context: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    lastMessage: {
      type: String
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    messageHistory: [{
      role: {
        type: String,
        enum: ['user', 'assistant'],
        required: true
      },
      content: {
        type: String,
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    }]
  },
  {
    timestamps: true
  }
);

// 索引
ConversationSchema.index({ lineId: 1 });
ConversationSchema.index({ userId: 1 });
ConversationSchema.index({ lastUpdated: 1 });

// 更新最後更新時間
ConversationSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model('Conversation', ConversationSchema);

