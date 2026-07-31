const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ message: 'Not authorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ message: 'User not found' });
    if (req.user.isActive === false) return res.status(401).json({ message: 'Account deactivated' });

    // Fire-and-forget: mark this user as "active now" without slowing down
    // the actual request. Used by the Users page to show an "online" badge
    // for anyone active in the last few minutes.
    User.findByIdAndUpdate(req.user._id, { lastActiveAt: new Date() }).catch(() => {});

    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};