const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../../shared/prisma');
const { z } = require('zod');
require('dotenv').config();

const app = express();
app.use(express.json());

const registerSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'BUYER']).optional(),
});

app.post('/register', async (req, res) => {
  try {
    console.log('[Auth Service] Hit /register');
    const { username, password, role } = registerSchema.parse(req.body);
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('[Auth Service] Creating user in Prisma...');
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: role || 'BUYER',
      },
    });

    res.status(201).json({ message: 'User created', userId: user.id });
  } catch (err) {
    res.status(400).json({ error: err.errors || 'User already exists or invalid data' });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await prisma.user.findUnique({ where: { username } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  res.json({ token });
});

const PORT = process.env.AUTH_PORT || 3001;
app.listen(PORT, () => console.log(`Auth Service running on port ${PORT}`));
