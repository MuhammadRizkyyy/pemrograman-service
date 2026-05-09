const express = require('express');
const prisma = require('../../shared/prisma');
const { authenticateToken, authorizeRole } = require('../../shared/auth');
const { z } = require('zod');
require('dotenv').config();

const app = express();
app.use(express.json());

const itemSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  price: z.number().positive(),
  stock: z.number().int().nonnegative(),
});

// Get all items
app.get('/', async (req, res) => {
  const items = await prisma.item.findMany();
  res.json(items);
});

// Create item (Admin only)
app.post('/', authenticateToken, authorizeRole('ADMIN'), async (req, res) => {
  try {
    const data = itemSchema.parse(req.body);
    const item = await prisma.item.create({
      data: {
        ...data,
        sellerId: req.user.id,
      },
    });
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ error: err.errors || 'Invalid data' });
  }
});

// Update item (Admin only)
app.put('/:id', authenticateToken, authorizeRole('ADMIN'), async (req, res) => {
  try {
    const data = itemSchema.parse(req.body);
    const item = await prisma.item.update({
      where: { id: req.params.id },
      data,
    });
    res.json(item);
  } catch (err) {
    res.status(400).json({ error: 'Item not found or invalid data' });
  }
});

// Delete item (Admin only)
app.delete('/:id', authenticateToken, authorizeRole('ADMIN'), async (req, res) => {
  try {
    await prisma.item.delete({ where: { id: req.params.id } });
    res.json({ message: 'Item deleted' });
  } catch (err) {
    res.status(400).json({ error: 'Item not found' });
  }
});

const PORT = process.env.PRODUCT_PORT || 3002;
app.listen(PORT, () => console.log(`Product Service running on port ${PORT}`));
