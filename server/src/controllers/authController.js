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
    const isFirstUser = count === 0;
    const finalRole = isFirstUser
      ? 'Administrator'
      : (ALLOWED_SELF_REGISTER_ROLES.includes(role) ? role : 'Production Operator');

    // Security fix: anyone who isn't the very first user is created inactive
    // by default. They cannot log in until an Administrator approves them
    // via User Management (the same Activate button already used to
    // reactivate deactivated accounts). Prevents anyone who finds the site
    // URL from immediately getting working access to production/financial data.
    const user = await User.create({
      name, email, password, role: finalRole,
      isActive: isFirstUser
    });

    AuditLog.create({
      user: user._id,
      userName: user.name || user.email,
      action: 'register',
      entityType: 'User',
      entityId: user._id,
      entityLabel: user.email,
      details: isFirstUser ? `Registered as ${finalRole} (auto-approved, first user)` : `Registered as ${finalRole} (pending approval)`
    }).catch(err => console.error('Register audit log failed:', err.message));

    if (!isFirstUser) {
      return res.status(201).json({
        pending: true,
        message: 'Registration submitted. An Administrator must approve your account before you can log in.'
      });
    }

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

    // Block login for both pending (never approved) and deactivated accounts —
    // previously this only got caught later by the `protect` middleware on
    // the first API call, which handed out a valid token first and gave a
    // confusing "deactivated" error only after the user was already "in."
    if (user.isActive === false) {
      return res.status(403).json({ message: 'Your account is not active yet. Please contact an Administrator for approval.' });
    }

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