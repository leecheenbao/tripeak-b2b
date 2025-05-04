const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const logger = require('../utils/logger');
const ExcelJS = require('exceljs');
const lineService = require('../services/line');

/**
 * @desc    獲取所有訂單
 * @route   GET /api/orders
 * @access  Private
 */
exports.getOrders = async (req, res) => {
  try {
    // 篩選條件
    const filter = {};
    
    // 經銷商只能查看自己的訂單
    if (req.user.role === 'dealer') {
      filter.dealer = req.user._id;
    } else if (req.query.dealer) {
      // 管理員可以按經銷商篩選
      filter.dealer = req.query.dealer;
    }

    // 按狀態篩選
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // 按日期範圍篩選
    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) {
        filter.createdAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        const endDate = new Date(req.query.endDate);
        endDate.setDate(endDate.getDate() + 1); // 設置為第二天的 00:00:00
        filter.createdAt.$lt = endDate;
      }
    }

    // 按訂單編號模糊搜尋
    if (req.query.orderNumber) {
      filter.orderNumber = { $regex: req.query.orderNumber, $options: 'i' };
    }

    // 分頁設置
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    // 執行查詢
    const orders = await Order.find(filter)
      .populate('dealer', 'name companyName phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // 獲取總數
    const total = await Order.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: orders.length,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      data: orders
    });
  } catch (err) {
    logger.error(`獲取訂單列表失敗: ${err.message}`);
    res.status(500).json({
      success: false,
      error: '獲取訂單列表失敗'
    });
  }
};

/**
 * @desc    獲取單個訂單
 * @route   GET /api/orders/:id
 * @access  Private
 */
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate({
      path: 'dealer',
      select: 'name companyName phone email address lineId'
    });

    // 加入顯示  資訊
    console.log(order);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: '訂單不存在'
      });
    }

    // 檢查權限（經銷商只能查看自己的訂單）
    if (req.user.role === 'dealer' && order.dealer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: '無權訪問此訂單'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (err) {
    logger.error(`獲取訂單詳情失敗: ${err.message}`);
    res.status(500).json({
      success: false,
      error: '獲取訂單詳情失敗'
    });
  }
};

/**
 * @desc    創建訂單
 * @route   POST /api/orders
 * @access  Private
 */
exports.createOrder = async (req, res) => {
  try {
    const { items, note, recipient } = req.body;

    // 檢查聯絡人資訊
    if (recipient) {
      if (!recipient.name || !recipient.phone || !recipient.address) {
        return res.status(400).json({
          success: false,
          error: '聯絡人資訊不完整'
        });
      }
    }
    // 確保訂單包含產品
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: '訂單必須包含至少一項產品'
      });
    }

    // 提取產品 ID
    const productIds = items.map(item => item._id);

    // 查詢產品詳情
    const products = await Product.find({ _id: { $in: productIds } });

    console.log(products);
    // 確保所有產品都存在且激活
    if (products.length !== productIds.length) {
      return res.status(400).json({
        success: false,
        error: '一個或多個產品不存在或未激活'
      });
    }

    // 構建訂單項目
    const orderItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const product = products.find(p => p._id.toString() === item._id.toString());
      
      // 確認產品激活
      if (!product.isActive) {
        return res.status(400).json({
          success: false,
          error: `產品 ${product.name} 已下架，無法購買`
        });
      }

      // 計算項目金額
      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        quantity: item.quantity,
        price: product.price,
        unit: product.unit
      });
    }

    // 創建訂單編號
    const orderNumber = await Order.countDocuments({}) + 1;

    // 創建訂單
    const order = await Order.create({
      orderNumber: orderNumber,
      dealer: req.user._id,
      items: orderItems,
      totalAmount,
      note,
      recipient
    });

    // 查詢完整訂單信息
    const completeOrder = await Order.findById(order._id).populate({
      path: 'dealer',
      select: 'name companyName phone email address lineId'
    });

    // 發送 LINE 通知
    try {
      await lineService.sendOrderNotification('order_created', completeOrder);
    } catch (notifyErr) {
      logger.error(`發送訂單通知失敗: ${notifyErr.message}`);
    }

    res.status(201).json({
      success: true,
      data: completeOrder
    });
  } catch (err) {
    logger.error(`創建訂單失敗: ${err.message}`);
    res.status(500).json({
      success: false,
      error: '創建訂單失敗'
    });
  }
};

/**
 * @desc    更新訂單狀態
 * @route   PUT /api/orders/:id/status
 * @access  Private/Admin
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // 驗證狀態值
    const validStatuses = ['pending', 'processing', 'shipped', 'completed', 'paid', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: '無效的訂單狀態'
      });
    }

    // 查找訂單
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: '訂單不存在'
      });
    }

    // 更新狀態相關字段
    order.status = status;
    
    // 如果狀態是"已出貨"，設置出貨時間
    if (status === 'shipped') {
      order.shippingDate = new Date();
    }
    
    // 如果狀態是"已完成"，設置完成時間
    if (status === 'completed') {
      order.completedDate = new Date();
    }

    // 保存訂單
    await order.save();

    // 獲取完整訂單信息
    const updatedOrder = await Order.findById(req.params.id).populate({
      path: 'dealer',
      select: 'name companyName phone email address lineId'
    });

    // 發送 LINE 通知
    try {
      await lineService.sendOrderNotification(
        status === 'processing' ? 'order_processing' : 
        status === 'shipped' ? 'order_shipped' : 
        status === 'completed' ? 'order_completed' : 'order_status_update',
        updatedOrder
      );
    } catch (notifyErr) {
      logger.error(`發送訂單狀態更新通知失敗: ${notifyErr.message}`);
    }

    res.status(200).json({
      success: true,
      data: updatedOrder
    });
  } catch (err) {
    logger.error(`更新訂單狀態失敗: ${err.message}`);
    res.status(500).json({
      success: false,
      error: '更新訂單狀態失敗'
    });
  }
};

/**
 * @desc    更新訂單
 * @route   PUT /api/orders/:id
 * @access  Private/Admin
 */
exports.updateOrder = async (req, res) => {
  try {
    const { note, recipient } = req.body;

    const fieldsToUpdate = {
      note,
      recipient
    };

    // 過濾掉未提供的欄位
    Object.keys(fieldsToUpdate).forEach(key => {
      if (fieldsToUpdate[key] === undefined) {
        delete fieldsToUpdate[key];
      }
    });

    // 更新訂單
    const order = await Order.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    }).populate({
      path: 'dealer',
      select: 'name companyName phone email address lineId'
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: '訂單不存在'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (err) {
    logger.error(`更新訂單失敗: ${err.message}`);
    res.status(500).json({
      success: false,
      error: '更新訂單失敗'
    });
  }
};

/**
 * @desc    刪除訂單
 * @route   DELETE /api/orders/:id
 * @access  Private/Admin
 */
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: '訂單不存在'
      });
    }

    await order.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    logger.error(`刪除訂單失敗: ${err.message}`);
    res.status(500).json({
      success: false,
      error: '刪除訂單失敗'
    });
  }
};

/**
 * @desc    導出訂單至 Excel
 * @route   GET /api/orders/export
 * @access  Private/Admin
 */
exports.exportOrders = async (req, res) => {
  try {
    // 篩選條件
    const filter = {};
    
    // 按狀態篩選
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // 按經銷商篩選
    if (req.query.dealer) {
      filter.dealer = req.query.dealer;
    }

    // 按日期範圍篩選
    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) {
        filter.createdAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        const endDate = new Date(req.query.endDate);
        endDate.setDate(endDate.getDate() + 1); // 設置為第二天的 00:00:00
        filter.createdAt.$lt = endDate;
      }
    }

    // 查詢訂單
    const orders = await Order.find(filter)
      .populate('dealer', 'name companyName phone email address')
      .sort({ createdAt: -1 });

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        error: '沒有符合條件的訂單'
      });
    }

    // 創建 Excel 文件
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('訂單報表');

    // 設置標題行
    worksheet.columns = [
      { header: '訂單編號', key: 'orderNumber', width: 20 },
      { header: '狀態', key: 'status', width: 15 },
      { header: '經銷商名稱', key: 'dealerName', width: 20 },
      { header: '公司名稱', key: 'companyName', width: 25 },
      { header: '聯繫電話', key: 'phone', width: 15 },
      { header: '訂單總額', key: 'totalAmount', width: 15 },
      { header: '下單時間', key: 'createdAt', width: 20 },
      { header: '產品明細', key: 'items', width: 40 },
      { header: '備註', key: 'note', width: 30 },
      { header: '配送地址', key: 'shippingAddress', width: 30 }
    ];

    // 填充數據
    orders.forEach(order => {
      // 處理狀態顯示
      let statusText;
      switch (order.status) {
        case 'pending':
          statusText = '處理中';
          break;
        case 'processing':
          statusText = '處理中';
          break;
        case 'shipped':
          statusText = '已出貨';
          break;
        case 'completed':
          statusText = '已完成';
          break;
        case 'cancelled':
          statusText = '已取消';
          break;
        default:
          statusText = order.status;
      }

      // 格式化產品明細
      const itemsText = order.items.map(item => 
        `${item.name} x ${item.quantity}${item.unit} (${item.price}/件)`
      ).join('\n');

      worksheet.addRow({
        orderNumber: order.orderNumber,
        status: statusText,
        dealerName: order.dealer.name,
        companyName: order.dealer.companyName,
        phone: order.dealer.phone,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt.toLocaleString(),
        items: itemsText,
        note: order.note || '',
        shippingAddress: order.shippingAddress || order.dealer.address || ''
      });
    });

    // 設置響應頭部
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=訂單報表_${new Date().toISOString().slice(0, 10)}.xlsx`
    );

    // 將工作簿寫入響應
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    logger.error(`導出訂單報表失敗: ${err.message}`);
    res.status(500).json({
      success: false,
      error: '導出訂單報表失敗'
    });
  }
}; 