const amqp = require('amqplib');
const { pool } = require('../config/database');

const EXCHANGE = 'marketplace_events';
const QUEUES = {
  ORDER_CREATED: 'order.created',
  ORDER_STATUS_UPDATED: 'order.status_updated',
};

let connection = null;
let channel = null;

const saveNotification = async (userId, type, title, message, metadata = null) => {
  await pool.execute(
    'INSERT INTO notifications (user_id, type, title, message, metadata) VALUES (?, ?, ?, ?, ?)',
    [userId, type, title, message, metadata ? JSON.stringify(metadata) : null]
  );
};

const logEvent = async (eventType, payload, status = 'processed', errorMessage = null) => {
  await pool.execute(
    'INSERT INTO notification_logs (event_type, payload, status, error_message) VALUES (?, ?, ?, ?)',
    [eventType, JSON.stringify(payload), status, errorMessage]
  );
};

const handleOrderCreated = async (payload) => {
  console.log('[Consumer] Processing ORDER_CREATED:', payload.orderId);

  const title = 'Pesanan Berhasil Dibuat';
  const message = `Pesanan #${payload.orderId} senilai Rp ${Number(payload.totalAmount).toLocaleString('id-ID')} telah berhasil dibuat. Menunggu konfirmasi penjual.`;

  await saveNotification(payload.buyerId, 'ORDER_CREATED', title, message, {
    orderId: payload.orderId,
    totalAmount: payload.totalAmount,
    itemCount: payload.items?.length || 0,
  });

  console.log(`[Consumer] Notification saved for buyer ${payload.buyerId}`);
};

const handleOrderStatusUpdated = async (payload) => {
  console.log('[Consumer] Processing ORDER_STATUS_UPDATED:', payload.orderId, '->', payload.newStatus);

  const statusMessages = {
    confirmed: `Pesanan #${payload.orderId} telah dikonfirmasi oleh penjual.`,
    shipped: `Pesanan #${payload.orderId} sedang dalam pengiriman.`,
    delivered: `Pesanan #${payload.orderId} telah diterima. Terima kasih telah berbelanja!`,
    cancelled: `Pesanan #${payload.orderId} telah dibatalkan.`,
  };

  const statusTitles = {
    confirmed: 'Pesanan Dikonfirmasi',
    shipped: 'Pesanan Dikirim',
    delivered: 'Pesanan Diterima',
    cancelled: 'Pesanan Dibatalkan',
  };

  const title = statusTitles[payload.newStatus] || 'Status Pesanan Diperbarui';
  const message = statusMessages[payload.newStatus] || `Status pesanan #${payload.orderId} diperbarui menjadi ${payload.newStatus}.`;

  await saveNotification(payload.buyerId, `ORDER_${payload.newStatus.toUpperCase()}`, title, message, {
    orderId: payload.orderId,
    oldStatus: payload.oldStatus,
    newStatus: payload.newStatus,
  });

  console.log(`[Consumer] Status notification saved for buyer ${payload.buyerId}`);
};

const processMessage = async (msg) => {
  if (!msg) return;

  let payload;
  try {
    payload = JSON.parse(msg.content.toString());
  } catch (parseErr) {
    console.error('[Consumer] Failed to parse message:', parseErr.message);
    channel.nack(msg, false, false); // Dead letter
    return;
  }

  try {
    const routingKey = msg.fields.routingKey;

    if (routingKey === 'order.created') {
      await handleOrderCreated(payload);
    } else if (routingKey.startsWith('order.status.')) {
      await handleOrderStatusUpdated(payload);
    } else {
      console.warn('[Consumer] Unknown routing key:', routingKey);
    }

    await logEvent(payload.event || routingKey, payload, 'processed');
    channel.ack(msg);
  } catch (err) {
    console.error('[Consumer] Error processing message:', err.message);
    await logEvent(payload.event || 'UNKNOWN', payload, 'failed', err.message).catch(() => {});

    // Requeue once, then dead letter
    if (msg.fields.redelivered) {
      console.error('[Consumer] Message redelivered and failed again, sending to DLQ');
      channel.nack(msg, false, false);
    } else {
      channel.nack(msg, false, true); // Requeue once
    }
  }
};

const startConsumer = async (retries = 5, delay = 3000) => {
  for (let i = 0; i < retries; i++) {
    try {
      connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
      channel = await connection.createChannel();

      await channel.assertExchange(EXCHANGE, 'topic', { durable: true });

      // Dead letter exchange
      await channel.assertExchange(`${EXCHANGE}.dlx`, 'topic', { durable: true });
      await channel.assertQueue(`${QUEUES.ORDER_CREATED}.dead`, { durable: true });
      await channel.bindQueue(`${QUEUES.ORDER_CREATED}.dead`, `${EXCHANGE}.dlx`, `${QUEUES.ORDER_CREATED}.dead`);

      await channel.assertQueue(QUEUES.ORDER_CREATED, {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': `${EXCHANGE}.dlx`,
          'x-dead-letter-routing-key': `${QUEUES.ORDER_CREATED}.dead`,
        },
      });
      await channel.assertQueue(QUEUES.ORDER_STATUS_UPDATED, { durable: true });

      await channel.bindQueue(QUEUES.ORDER_CREATED, EXCHANGE, 'order.created');
      await channel.bindQueue(QUEUES.ORDER_STATUS_UPDATED, EXCHANGE, 'order.status.*');

      channel.prefetch(1); // Process one message at a time

      channel.consume(QUEUES.ORDER_CREATED, processMessage);
      channel.consume(QUEUES.ORDER_STATUS_UPDATED, processMessage);

      connection.on('error', (err) => {
        console.error('[RabbitMQ Consumer] Connection error:', err.message);
      });
      connection.on('close', () => {
        console.warn('[RabbitMQ Consumer] Connection closed, reconnecting...');
        setTimeout(() => startConsumer(), delay);
      });

      console.log('[RabbitMQ Consumer] Listening for order events...');
      return;
    } catch (err) {
      console.error(`[RabbitMQ Consumer] Attempt ${i + 1}/${retries} failed:`, err.message);
      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  console.error('[RabbitMQ Consumer] All attempts failed. Consumer not running.');
};

module.exports = { startConsumer };
