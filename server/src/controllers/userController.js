const User = require('../models/User');
const { logAction } = require('../utils/auditLog');

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const allowedRoles = ['Administrator', 'Manager', 'Production Operator', 'Store Keeper'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    if (req.params.id === req.user.id && role !== 'Administrator') {
      return res.status(400).json({ message: 'You cannot change your own role away from Administrator' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    await logAction(req, { action: 'role_change', entityType: 'User', entityId: user._id, entityLabel: user.email, details: `Role set to ${role}` });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    if (req.params.id === req.user.id && isActive === false) {
      return res.status(400).json({ message: 'You cannot deactivate your own account' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    await logAction(req, { action: isActive ? 'activate' : 'deactivate', entityType: 'User', entityId: user._id, entityLabel: user.email });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.resetUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.password = newPassword;
    await user.save();
    await logAction(req, { action: 'password_reset', entityType: 'User', entityId: user._id, entityLabel: user.email });
    res.json({ message: `Password reset for ${user.email}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/users/online — Administrator only. "Online" is a proxy, not true
// real-time presence — anyone whose lastActiveAt is within the last 5
// minutes (based on their authenticated requests hitting the server).
exports.getOnlineUsers = async (req, res) => {
  try {
    const cutoff = new Date(Date.now() - 5 * 60 * 1000);
    const users = await User.find({ lastActiveAt: { $gte: cutoff } }).select('name email role lastActiveAt');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};