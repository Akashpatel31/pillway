const db = require('../config/db');

exports.signup = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  try {
    const [existing] = await db.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const [result] = await db.execute(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, password]
    );

    res.status(201).json({
      message: 'Signup success',
      user: {
        id: result.insertId,
        name,
        email
      }
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const [emailRows] = await db.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (emailRows.length === 0) {
      return res.status(404).json({ message: 'User not found. Please sign up.' });
    }

    const [rows] = await db.execute(
      'SELECT * FROM users WHERE email = ? AND password = ?',
      [email, password]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    res.json({ user: rows[0] });

  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};