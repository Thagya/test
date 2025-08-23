const Cart = require("../models/Cart");
const Product = require("../models/Product");

// Create a new cart
exports.createCart = async (req, res) => {
  try {
    const cart = new Cart({ items: [] });
    await cart.save();
    res.json({ message: "Cart created", cartId: cart._id });
  } catch (err) {
    res.status(500).json({ error: "Failed to create cart" });
  }
};

// Add item to cart
exports.addToCart = async (req, res) => {
  try {
    const { cartId, productId, quantity } = req.body;
    if (!cartId || !productId || !quantity)
      return res.status(400).json({ error: "cartId, productId & quantity required" });

    const cart = await Cart.findById(cartId);
    if (!cart) return res.status(404).json({ error: "Cart not found" });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: "Product not found" });

    // check if item exists → update quantity
    const existingItem = cart.items.find((i) => i.product.toString() === productId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }

    await cart.save();
    res.json({ message: "Item added", cart });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all items in a cart
exports.getCart = async (req, res) => {
  try {
    const { cartId } = req.query;
    if (!cartId) return res.status(400).json({ error: "cartId required" });

    const cart = await Cart.findById(cartId).populate("items.product");
    if (!cart) return res.status(404).json({ error: "Cart not found" });

    res.json(cart.items.map((item) => ({
      id: item._id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update cart item quantity
exports.updateCartItem = async (req, res) => {
  try {
    const { id } = req.params; // cart item id
    const { quantity } = req.body;
    if (!quantity) return res.status(400).json({ error: "Quantity required" });

    const cart = await Cart.findOne({ "items._id": id });
    if (!cart) return res.status(404).json({ error: "Item not found" });

    const item = cart.items.id(id);
    item.quantity = quantity;
    await cart.save();

    res.json({ message: "Cart item updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
  try {
    const { id } = req.params; // cart item id

    const cart = await Cart.findOne({ "items._id": id });
    if (!cart) return res.status(404).json({ error: "Item not found" });

    cart.items.id(id).remove();
    await cart.save();

    res.json({ message: "Item removed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
