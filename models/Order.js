// ecommerce-backend/models/Order.js - NEW ORDER MODEL (Optional but recommended)
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  items: [{
    product: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Product", 
      required: true 
    },
    name: { 
      type: String, 
      required: true 
    },
    price: { 
      type: Number, 
      required: true 
    },
    quantity: { 
      type: Number, 
      required: true, 
      min: 1 
    },
    image: { 
      type: String, 
      default: "" 
    }
  }],
  totalAmount: { 
    type: Number, 
    required: true,
    min: 0
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'paypal', 'cash'],
    default: 'stripe'
  },
  stripeSessionId: {
    type: String,
    unique: true,
    sparse: true
  },
  shippingAddress: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    address: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'Sri Lanka' }
  },
  trackingNumber: {
    type: String,
    default: null
  },
  notes: {
    type: String,
    default: ""
  }
}, { 
  timestamps: true 
});

// Indexes for better query performance
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ stripeSessionId: 1 });

// Virtual for order number
orderSchema.virtual('orderNumber').get(function() {
  return 'ECO-' + this._id.toString().slice(-8).toUpperCase();
});

// Method to calculate total items
orderSchema.methods.getTotalItems = function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
};

// Static method to get user's order history
orderSchema.statics.getUserOrders = function(userId, options = {}) {
  const { page = 1, limit = 10, status } = options;
  const skip = (page - 1) * limit;
  
  let query = { user: userId };
  if (status) {
    query.orderStatus = status;
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('items.product', 'name image category');
};

// Static method to get orders by status
orderSchema.statics.getOrdersByStatus = function(status, options = {}) {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;
  
  return this.find({ orderStatus: status })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('user', 'username email')
    .populate('items.product', 'name image category');
};

module.exports = mongoose.model("Order", orderSchema);