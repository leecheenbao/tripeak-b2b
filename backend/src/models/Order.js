const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true
    },
    dealer: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    items: [
      {
        product: {
          type: mongoose.Schema.ObjectId,
          ref: 'Product',
          required: true
        },
        name: String,
        quantity: {
          type: Number,
          required: true,
          min: [1, '數量必須至少為1']
        },
        price: {
          type: Number,
          required: true
        },
        unit: String
      }
    ],
    totalAmount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'completed', 'paid', 'cancelled'],
      default: 'pending'
    },
    note: {
      type: String,
      maxlength: [500, '備註不能超過500個字']
    },
    shippingAddress: {
      type: String
    },
    shippingDate: {
      type: Date
    },
    completedDate: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// 生成訂單編號的中間件
OrderSchema.pre('save', async function(next) {
  if (this.isNew) {
    // 生成訂單編號格式：TP + 年月日 + 4位隨機數字
    const date = new Date();
    const year = date.getFullYear().toString().slice(2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000).toString();
    
    this.orderNumber = `TP${year}${month}${day}${random}`;
  }
  
  next();
});

module.exports = mongoose.model('Order', OrderSchema); 