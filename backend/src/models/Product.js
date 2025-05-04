const mongoose = require('mongoose');
const slugify = require('slugify');

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, '請提供產品名稱'],
      trim: true,
      maxlength: [100, '產品名稱不能超過100個字']
    },
    slug: String,
    description: {
      type: String,
      maxlength: [2000, '描述不能超過2000個字']
    },
    sku: {
      type: String,
      required: [true, '請提供產品編號'],
      unique: true,
      trim: true
    },
    price: {
      type: Number,
      required: [true, '請提供產品價格']
    },
    stockQuantity: {
      type: Number,
      default: 0
    },
    imageUrl: {
      type: String,
      default: 'no-image.jpg'
    },
    image: {
      type: Buffer,
      default: null
    },
    imageType: {
      type: String,
      default: null
    },
    category: {
      type: mongoose.Schema.ObjectId,
      ref: 'Category',
      required: [true, '請選擇產品分類']
    },
    isActive: {
      type: Boolean,
      default: true
    },
    displayOrder: {
      type: Number,
      default: 0
    },
    unit: {
      type: String,
      default: '件'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// 創建 slug
ProductSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

module.exports = mongoose.model('Product', ProductSchema); 