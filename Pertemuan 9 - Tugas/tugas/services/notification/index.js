const amqp = require('amqplib');
require('dotenv').config();

const queue = 'transaction_events';

const startConsumer = async () => {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    const channel = await connection.createChannel();

    await channel.assertQueue(queue);
    console.log(`Notification Service: Waiting for messages in ${queue}...`);

    channel.consume(queue, (msg) => {
      if (msg !== null) {
        const content = JSON.parse(msg.content.toString());
        console.log('--- NEW NOTIFICATION ---');
        console.log(`Event: ${content.event}`);
        console.log(`Details: Transaction ${content.data.id} completed for Item ${content.data.itemId}`);
        console.log('------------------------');
        channel.ack(msg);
      }
    });
  } catch (err) {
    console.warn('Notification Service: Message Broker not available, consumer is idle.');
  }
};

startConsumer();
