const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Signup controller
exports.signup = async (req, res) => {
	try {
		const { name, email, password, phoneNu } = req.body;
		// Check if user already exists
		const existingUser = await User.findOne({ email });
		if (existingUser) {
			return res.status(400).json({ message: 'User already exists' });
		}
		// Hash password
		const hashedPassword = await bcrypt.hash(password, 10);
		// Create user
		const user = new User({ name, email, password: hashedPassword, phoneNu:phoneNu  });
		await user.save();
		res.status(201).json({ message: 'User created successfully' });
	} catch (error) {
        console.error(error);
		res.status(500).json({ message: 'Server error', error });
	}
};

// Login controller
exports.login = async (req, res) => {
	try {
		const { email, password } = req.body;
		const user = await User.findOne({ email });
		if (!user) {
			return res.status(400).json({ message: 'Invalid credentials' });
		}
		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			return res.status(400).json({ message: 'Invalid credentials' });
		}
		// Generate JWT token
        user.password=undefined;
		const token = jwt.sign({ userId: user._id, userRole:user.role}, 'your_jwt_secret', { expiresIn: '1h' });
		res.status(200).json({ token, user });
	} catch (error) {
		res.status(500).json({ message: 'Server error', error });
	}
};
// ...existing code...
