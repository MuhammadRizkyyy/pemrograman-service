const amqp = require('amqplib');

let connection = null;
let channel = null;

const EXCHANGE = 'marketplace_events';
const QUEUES = {
  ORDER_CREATED: 'order.created',
  ORDER_STATUS_UPDATED: 'order.status_updated',
};

const connect = async (retries = 5, delay = 3000) => {
  for (let i = 0; i < retries; i++) {
    try {
      connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
      channel = await connection.createChannel();

      // Declare exchange (topic type for flexible routing)
      await channel.assertExchange(EXCHANGE, 'topic', { durable: true });

      // Declare queues
      await channel.assertQueue(QUEUES.ORDER_CREATED, {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': `${EXCHANGE}.dlx`,
          'x-dead-letter-routing-key': `${QUEUES.ORDER_CREATED}.dead`,
        },
      });
      await channel.assertQueue(QUEUES.ORDER_STATUS_UPDATED, { durable: true });

      // Dead letter exchange for failed messages
      await channel.assertExchange(`${EXCHANGE}.dlx`, 'topic', { durable: true });
      await channel.assertQueue(`${QUEUES.ORDER_CREATED}.dead`, { durable: true });
      await channel.bindQueue(`${QUEUES.ORDER_CREATED}.dead`, `${EXCHANGE}.dlx`, `${QUEUES.ORDER_CREATED}.dead`);

      // Bind queues to exchange
      await channel.bindQueue(QUEUES.ORDER_CREATED, EXCHANGE, 'order.created');
      await channel.bindQueue(QUEUES.ORDER_STATUS_UPDATED, EXCHANGE, 'order.status.*');

      connection.on('error', (err) => {
        console.error('[RabbitMQ] Connection error:', err.message);
      });
      connection.on('close', () => {
        console.warn('[RabbitMQ] Connection closed, reconnecting...');
        setTimeout(() => connect(), delay);
      });

      console.log('[RabbitMQ] Connected successfully');
      return channel;
    } catch (err) {
      console.error(`[RabbitMQ] Connection attempt ${i + 1}/${retries} failed:`, err.message);
      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  console.error('[RabbitMQ] All connection attempts failed. Running without message broker.');
  return null;
};

const publish = async (routingKey, message) => {
  if (!channel) {
    console.warn('[RabbitMQ] No channel available, skipping publish');
    return false;
  }
  try {
    const payload = Buffer.from(JSON.stringify(message));
    channel.publish(EXCHANGE, routingKey, payload, {
      persistent: true,
      contentType: 'application/json',
      timestamp: Date.now(),
    });
    console.log(`[RabbitMQ] Published to ${routingKey}:`, message);
    return true;
  } catch (err) {
    console.error('[RabbitMQ] Publish error:', err.message);
    return false;
  }
};

const getChannel = () => channel;

module.exports = { connect, publish, getChannel, EXCHANGE, QUEUES };
