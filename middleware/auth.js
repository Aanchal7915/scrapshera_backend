// ...existing code...
const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Middleware to verify JWT and attach user to request
exports.authenticate = async (req, res, next) => {
	const token = req.header('Authorization')?.replace('Bearer ', '');
	if (!token) {
		return res.status(401).json({ message: 'No token, authorization denied' });
	}
	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRETE);
		req.user = await User.findById(decoded.userId).select('-password');
		if (!req.user) {
			return res.status(401).json({ message: 'User not found' });
		}
		next();
	} catch (err) {
        console.error(err);
		res.status(401).json({ message: 'Token is not valid' });
	}
};

// Middleware to check for admin role
exports.isAdmin = (req, res, next) => {
	if (req.user && req.user.role === 'admin') {
		next();
	} else {
		res.status(403).json({ message: 'Access denied: Admins only' });
	}
};

// Middleware to check for user role
exports.isUser = (req, res, next) => {
	if (req.user && req.user.role === 'user') {
		next();
	} else {
		res.status(403).json({ message: 'Access denied: Users only' });
	}
};
// ...existing code...
