const User = require('../models/User');
const jwt = require('jsonwebtoken');
const AuditLog = require('../models/AuditLog');

const ALLOWED_SELF_REGISTER_ROLES = ['Manager', 'Production Operator', 'Store Keeper'];

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'User already exists' });

    const count = await User.countDocuments();
    const finalRole = count === 0
      ? 'Administrator'
      : (ALLOWED_SELF_REGISTER_ROLES.includes(role) ? role : 'Production Operator');

    const user = await User.create({ name, email, password, role: finalRole });

    AuditLog.create({
      user: user._id,
      userName: user.name || user.email,
      action: 'register',
      entityType: 'User',
      entityId: user._id,
      entityLabel: user.email,
      details: `Registered as ${finalRole}`
    }).catch(err => console.error('Register audit log failed:', err.message));

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

    user.lastLoginAt = new Date();
    user.lastActiveAt = new Date();
    await user.save();

    AuditLog.create({
      user: user._id,
      userName: user.name || user.email,
      action: 'login',
      entityType: 'User',
      entityId: user._id,
      entityLabel: user.email
    }).catch(err => console.error('Login audit log failed:', err.message));

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user._id, name: user.name, email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/logout — requires a valid token (still logged in at the
// moment this is called), so we can attribute the logout event correctly.
exports.logout = async (req, res) => {
  try {
    AuditLog.create({
      user: req.user._id,
      userName: req.user.name || req.user.email,
      action: 'logout',
      entityType: 'User',
      entityId: req.user._id,
      entityLabel: req.user.email
    }).catch(err => console.error('Logout audit log failed:', err.message));

    res.json({ message: 'Logged out' });
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