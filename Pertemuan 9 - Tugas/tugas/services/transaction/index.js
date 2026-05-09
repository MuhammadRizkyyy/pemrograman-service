const express = require('express');
const prisma = require('../../shared/prisma');
const { authenticateToken } = require('../../shared/auth');
const { connectBroker, publishEvent } = require('../../shared/broker');
require('dotenv').config();

const app = express();
app.use(express.json());

connectBroker();

app.post('/buy', authenticateToken, async (req, res) => {
  const { itemId, quantity } = req.body;

  try {
    const item = await prisma.item.findUnique({ where: { id: itemId } });

    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.stock < quantity) return res.status(400).json({ error: 'Insufficient stock' });

    const totalPrice = item.price * quantity;

    const transaction = await prisma.$transaction(async (tx) => {
      // Create transaction
      const t = await tx.transaction.create({
        data: {
          itemId,
          buyerId: req.user.id,
          quantity,
          totalPrice,
          status: 'COMPLETED'
        },
      });

      // Update stock
      await tx.item.update({
        where: { id: itemId },
        data: { stock: { decrement: quantity } },
      });

      return t;
    });

    // Notify via Message Broker
    publishEvent('TRANSACTION_CREATED', transaction);

    res.status(201).json({ message: 'Purchase successful', transaction });
  } catch (err) {
    res.status(500).json({ error: 'Transaction failed' });
  }
});

app.get('/history', authenticateToken, async (req, res) => {
  const transactions = await prisma.transaction.findMany({
    where: { buyerId: req.user.id },
    include: { item: true }
  });
  res.json(transactions);
});

const PORT = process.env.TRANSACTION_PORT || 3003;
app.listen(PORT, () => console.log(`Transaction Service running on port ${PORT}`));
