const { validationResult } = require('express-validator');
const axios = require('axios');
const { pool } = require('../config/database');
const { publish } = require('../config/rabbitmq');

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002';

// POST /orders  (buyer only)
const createOrder = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }

  const { items, shipping_address, notes } = req.body;
  const buyer_id = req.user.id;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Validate products and calculate total
    let totalAmount = 0;
    const enrichedItems = [];

    for (const item of items) {
      const { data: productRes } = await axios.get(
        `${PRODUCT_SERVICE_URL}/products/${item.product_id}`
      );

      if (!productRes.success || !productRes.data.is_active) {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          message: `Product ${item.product_id} is not available`,
        });
      }

      const product = productRes.data;
      if (product.stock < item.quantity) {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product: ${product.name}`,
        });
      }

      const subtotal = parseFloat(product.price) * item.quantity;
      totalAmount += subtotal;
      enrichedItems.push({
        product_id: item.product_id,
        product_name: product.name,
        quantity: item.quantity,
        unit_price: product.price,
        subtotal,
      });
    }

    // Create order
    const [orderResult] = await conn.execute(
      'INSERT INTO orders (buyer_id, total_amount, shipping_address, notes) VALUES (?, ?, ?, ?)',
      [buyer_id, totalAmount, shipping_address, notes || null]
    );
    const orderId = orderResult.insertId;

    // Insert order items
    for (const item of enrichedItems) {
      await conn.execute(
        `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.product_name, item.quantity, item.unit_price, item.subtotal]
      );
    }

    await conn.commit();

    // Reduce stock via product service (fire and forget with error handling)
    try {
      await axios.post(`${PRODUCT_SERVICE_URL}/products/internal/reduce-stock`, {
        items: enrichedItems.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
      });
    } catch (stockErr) {
      console.error('[createOrder] Failed to reduce stock:', stockErr.message);
      // Stock reduction failure is logged but order is already committed
      // In production, use saga pattern or compensating transaction
    }

    // Publish event to RabbitMQ
    await publish('order.created', {
      event: 'ORDER_CREATED',
      orderId,
      buyerId: buyer_id,
      buyerName: req.user.name,
      buyerEmail: req.user.email,
      totalAmount,
      items: enrichedItems,
      shippingAddress: shipping_address,
      createdAt: new Date().toISOString(),
    });

    const [newOrder] = await pool.execute(
      `SELECT o.*, GROUP_CONCAT(
        JSON_OBJECT(
          'id', oi.id,
          'product_id', oi.product_id,
          'product_name', oi.product_name,
          'quantity', oi.quantity,
          'unit_price', oi.unit_price,
          'subtotal', oi.subtotal
        )
      ) as items_json
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.id = ?
      GROUP BY o.id`,
      [orderId]
    );

    const order = newOrder[0];
    order.items = order.items_json ? JSON.parse(`[${order.items_json}]`) : [];
    delete order.items_json;

    return res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order,
    });
  } catch (err) {
    await conn.rollback();
    console.error('[createOrder]', err);
    if (err.response) {
      return res.status(err.response.status).json({
        success: false,
        message: err.response.data?.message || 'Product service error',
      });
    }
    return res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    conn.release();
  }
};

// GET /orders  (buyer sees own orders, admin sees all)
const getAllOrders = async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const pageNum  = Math.max(1, parseInt(page, 10)  || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 10);
  const offset   = (pageNum - 1) * limitNum;

  let whereClause = '';
  const params = [];

  if (req.user.role !== 'admin') {
    whereClause = 'WHERE o.buyer_id = ?';
    params.push(req.user.id);
  }

  if (status) {
    whereClause += whereClause ? ' AND o.status = ?' : 'WHERE o.status = ?';
    params.push(status);
  }

  try {
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) as total FROM orders o ${whereClause}`,
      params
    );
    const total = countRows[0].total;

    const [rows] = await pool.query(
      `SELECT o.id, o.buyer_id, o.status, o.total_amount, o.shipping_address, o.notes, o.created_at, o.updated_at
       FROM orders o ${whereClause}
       ORDER BY o.created_at DESC LIMIT ${limitNum} OFFSET ${offset}`,
      params
    );

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    console.error('[getAllOrders]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// GET /orders/:id
const getOrderById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.execute(
      `SELECT o.id, o.buyer_id, o.status, o.total_amount, o.shipping_address, o.notes, o.created_at, o.updated_at
       FROM orders o WHERE o.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const order = rows[0];

    // Only owner or admin can view
    if (req.user.role !== 'admin' && order.buyer_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const [items] = await pool.execute(
      'SELECT * FROM order_items WHERE order_id = ?',
      [id]
    );

    order.items = items;
    return res.status(200).json({ success: true, data: order });
  } catch (err) {
    console.error('[getOrderById]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// PUT /orders/:id/status  (admin/seller)
const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['confirmed', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Valid values: ${validStatuses.join(', ')}`,
    });
  }

  try {
    const [existing] = await pool.execute('SELECT * FROM orders WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const order = existing[0];

    // Buyer can only cancel their own pending order
    if (req.user.role === 'buyer') {
      if (order.buyer_id !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
      if (status !== 'cancelled' || order.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Buyers can only cancel pending orders',
        });
      }
    }

    await pool.execute('UPDATE orders SET status = ? WHERE id = ?', [status, id]);

    // Publish status update event
    await publish(`order.status.${status}`, {
      event: 'ORDER_STATUS_UPDATED',
      orderId: parseInt(id),
      buyerId: order.buyer_id,
      oldStatus: order.status,
      newStatus: status,
      updatedAt: new Date().toISOString(),
    });

    return res.status(200).json({ success: true, message: `Order status updated to ${status}` });
  } catch (err) {
    console.error('[updateOrderStatus]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// DELETE /orders/:id  (admin only - hard delete)
const deleteOrder = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.execute('DELETE FROM orders WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    return res.status(200).json({ success: true, message: 'Order deleted' });
  } catch (err) {
    console.error('[deleteOrder]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { createOrder, getAllOrders, getOrderById, updateOrderStatus, deleteOrder };
