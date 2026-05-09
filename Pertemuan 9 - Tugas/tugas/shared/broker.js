const amqp = require('amqplib');
require('dotenv').config();

let channel;

const connectBroker = async () => {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    channel = await connection.createChannel();
    await channel.assertQueue('transaction_events');
    console.log('Connected to Message Broker');
  } catch (err) {
    console.warn('Message Broker not available, running in offline mode');
  }
};

const publishEvent = (event, data) => {
  if (channel) {
    const message = JSON.stringify({ event, data, timestamp: new Date() });
    channel.sendToQueue('transaction_events', Buffer.from(message));
    console.log(`Event published: ${event}`);
  } else {
    console.log(`Event (Offline): ${event}`, data);
  }
};

module.exports = { connectBroker, publishEvent };
