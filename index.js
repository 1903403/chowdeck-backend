// index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const pool = require('./db');
const Intl = require('intl');
require('intl/locale-data/jsonp/en');

const app = express();
// const PORT = process.env.PORT || 5000;
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

// Middleware
app.use(cors({origin: '*'}));  // Allows Flutter calls
app.use(express.json());  // Parses JSON bodies

// ---------- SIGN-UP ENDPOINT ----------
app.post('/signup', async (req, res) => {
  try {
    const { phone, email, firstName, lastName, birthday } = req.body;

    // Validate required fields
    if (!phone || !firstName || !lastName || !birthday) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user exists (by phone)
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE phone = $1',
      [phone]
    );
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Insert new user
    const newUser = await pool.query(
      'INSERT INTO users (phone, email, first_name, last_name, birthday) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [phone, email || null, firstName, lastName, birthday]
    );

    res.status(201).json({ message: 'User created', user: newUser.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ---------- SIGN-IN ENDPOINT ----------
app.post('/signin', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Phone required' });
    }

    // Check if user exists
    const user = await pool.query(
      'SELECT * FROM users WHERE phone = $1',
      [phone]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // For now, just return user (add OTP later)
    res.json({ message: 'User found', user: user.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Backend is running!' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`Access from phone: http://172.20.10.5:${PORT}`);
});
// app.listen(PORT, () => {
//   console.log(`Server on http://localhost:${PORT}`);
// });

// REPLACE your GET route with this POST route
// app.post('/api/user', async (req, res) => {
//   const { phone } = req.body;

//   if (!phone) {
//     return res.status(400).json({ error: 'Phone number is required' });
//   }

//   try {
//     const result = await pool.query(
//       'SELECT phone, email, first_name, last_name, birthday FROM users WHERE phone = $1',
//       [phone]
//     );

//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     const user = result.rows[0];
//     const formattedBirthday = user.birthday
//       ? new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric' }).format(user.birthday)
//       : null;

//     res.json({
//       phone: user.phone,
//       email: user.email || null,
//       firstName: user.first_name,
//       lastName: user.last_name,
//       birthday: formattedBirthday,
//     });
//   } catch (error) {
//     console.error('Get user error:', error);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

app.get('/api/user', async (req, res) => {
  let { phone } = req.query;

  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  // ADD + BACK if missing
  if (!phone.startsWith('+')) {
    phone = '+' + phone;
  }

  try {
    const result = await pool.query(
      'SELECT phone, email, first_name, last_name, birthday FROM users WHERE phone = $1',
      [phone]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    const formattedBirthday = user.birthday
      ? new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric' }).format(user.birthday)
      : null;

    res.json({
      phone: user.phone,
      email: user.email || null,
      firstName: user.first_name,
      lastName: user.last_name,
      birthday: formattedBirthday,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});