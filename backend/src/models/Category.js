const mongoose = require('mongoose');
const slugify = require('slugify');

const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, '請提供分類名稱'],
      unique: true,
      trim: true,
      maxlength: [50, '分類名稱不能超過50個字']
    },
    slug: String,
    description: {
      type: String,
      maxlength: [500, '描述不能超過500個字']
    },
    isActive: {
      type: Boolean,
      default: true
    },
    displayOrder: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// 創建 slug
CategorySchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

module.exports = mongoose.model('Category', CategorySchema); 