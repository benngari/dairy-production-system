const User = require('../models/User');
const jwt = require('jsonwebtoken');

const ALLOWED_SELF_REGISTER_ROLES = ['Manager', 'Production Operator', 'Store Keeper'];

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'User already exists' });

    const count = await User.countDocuments();
    // First user is always Administrator, regardless of what was submitted.
    // Everyone after that can only self-select from the non-admin role list —
    // Administrator can never be granted through public registration.
    const finalRole = count === 0
      ? 'Administrator'
      : (ALLOWED_SELF_REGISTER_ROLES.includes(role) ? role : 'Production Operator');

    const user = await User.create({ name, email, password, role: finalRole });
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({ token, user: { id: user._id, name, email, role: finalRole } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user._id, name: user.name, email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};