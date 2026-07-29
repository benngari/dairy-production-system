const User = require('../models/User');

// GET /api/users — Administrator only
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/users/:id/role — Administrator only
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const allowedRoles = ['Administrator', 'Manager', 'Production Operator', 'Store Keeper'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    // Prevent an admin from demoting themselves and locking everyone out
    if (req.params.id === req.user.id && role !== 'Administrator') {
      return res.status(400).json({ message: 'You cannot change your own role away from Administrator' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/users/:id/status — Administrator only (activate/deactivate)
exports.updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    if (req.params.id === req.user.id && isActive === false) {
      return res.status(400).json({ message: 'You cannot deactivate your own account' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
  
};
// PATCH /api/users/:id/password — Administrator only.
// Lets an admin set a new password for a locked-out user. No email service
// required — the admin shares the new password with the user directly.
exports.resetUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.password = newPassword; // pre-save hook on the User model hashes this automatically
    await user.save();
    res.json({ message: `Password reset for ${user.email}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};