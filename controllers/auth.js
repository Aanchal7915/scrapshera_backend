const crypto = require('crypto');
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mailSender = require('../utils/mailSender');

const verifyEmailTokenExpiry = 1000 * 60*60;
const resetPassTokenExpiry = 1000 * 60 * 5;

// Login controller
exports.login = async (req, res) => {
	try {
		const { email, password } = req.body;
		if (!email || !password) {
			return res.status(400).json({ message: 'Email and password are required' });
		}

		const user = await User.findOne({ email });
		if (!user) {
			return res.status(400).json({ message: `User doesn'token! Please sign up first.` });
		}

		if (user.isVerified === false) {
			return res.status(403).json({ message: 'You have not verified your email. Please verify!' });
		}

		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			return res.status(400).json({ message: 'Invalid password!' });
		}

		// Generate JWT token
		user.password = undefined;
		const token = jwt.sign({ userId: user._id, userRole: user.role }, process.env.JWT_SECRETE, { expiresIn: '1h' });
		res.status(200).json({ token, user });
	} catch (err) {
		console.error("Error in login:", err);
		res.status(500).json({ message: 'Server error' });
	}
};

exports.signup = async (req, res) => {
	try {

		const { name, email, password, phoneNu } = req.body;
		// Check if user already exists
		if (!name || !email || !password || !phoneNu) {
			return res.status(400).json({ message: 'All fields are required' });
		}

		// Check if user exists
		const existingUser = await User.findOne({ email });
		if (existingUser) {
			return res.status(400).json({ message: 'Email already registered' });
		}

		// Generate verification token
		const emailVerificationToken = crypto.randomBytes(32).toString('hex');
		const emailVerificationExpires = Date.now() + verifyEmailTokenExpiry; // 1 hour

		// Hash password
		const hashedPassword = await bcrypt.hash(password, 10);

		// Create user (isVerified: false)
		const user = new User({
			email,
			password: hashedPassword, // hash if needed
			name,
			phoneNu,
			role: 'user',
			isVerified: false,
			emailVerificationToken,
			emailVerificationExpires,
		});
		await user.save();

		// Send verification email
		const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${emailVerificationToken}&email=${email}`;
		await mailSender(email, 'Verify your email', `<p>Click <a href="${verifyUrl}">here</a> to verify your email. This link expires in 1 hour.</p>`);


		res.status(201).json({ message: 'Signup successful! Please check your email to verify your account.' });
	} catch (err) {
		console.error("Error in signup:", err);
		res.status(500).json({ message: 'Server error' });
	}
};


exports.verifyEmail = async (req, res) => {
	try {
		const { token, email } = req.query;
		const user = await User.findOne({
			email,
			emailVerificationToken: token,
			emailVerificationExpires: { $gt: Date.now() },
		});
		if (!user) {
			return res.status(400).json({ message: 'Invalid or expired verification link.' });
		}
		user.isVerified = true;
		user.emailVerificationToken = undefined;
		user.emailVerificationExpires = undefined;
		await user.save();
		res.json({ message: 'Email verified successfully! You can now log in.' });
	} catch (err) {
		console.error("Error in verifyEmail:", err);
		res.status(500).json({ message: 'Server error' });
	}
};

exports.forgotPassword = async (req, res) => {
	try {
		const { email } = req.body;
		if (!email) {
			return res.status(400).json({ message: 'Email is required' });
		}
		const user = await User.findOne({ email });
		if (!user) {
			return res.status(400).json({ message: 'No user found with that email' });
		}
		if(user.isVerified === false) {
			return res.status(403).json({ message: 'You have not verified your email. Please verify!' });
		}
		const resetToken = crypto.randomBytes(32).toString('hex');
		const resetTokenExpiry = Date.now() + resetPassTokenExpiry; // 1 hour
		user.resetPasswordToken = resetToken;
		user.resetPasswordExpires = resetTokenExpiry;
		await user.save();
		const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${email}`;
		await mailSender(email, 'Password Reset', `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 1 hour.</p>`);
		res.json({ message: 'If the email exists, a reset link was sent.' });
	}
	catch (err) {
		console.error("Error in forgotPassword:", err);
		res.status(500).json({ message: 'Server error' });
	}
};
exports.resetPassword = async (req, res) => {
	try {
		const { token, email, newPassword } = req.body;
		if (!token || !email || !newPassword) {
			return res.status(400).json({ message: 'All fields are required' });
		}
		
		const user = await User.findOne({
			email,
			resetPasswordToken: token,
			resetPasswordExpires: { $gt: Date.now() },
		});
		if (!user) {
			return res.status(400).json({ message: 'Invalid or expired token' });
		}
		const hashedPassword = await bcrypt.hash(newPassword, 10);
		user.password = hashedPassword;
		user.resetPasswordToken = undefined;
		user.resetPasswordExpires = undefined;
		await user.save();
		res.json({ message: 'Password reset successful! You can now log in with your new password.' });
	} catch (err) {
		console.error("Error in resetPassword:", err);
		res.status(500).json({ message: 'Server error' });
	}
};

// Resend verification email
exports.resendVerificationEmail = async (req, res) => {
	try {
		const { email } = req.body;
		if (!email) {
			return res.status(400).json({ message: 'Email is required' });
		}
		const user = await User.findOne({ email });
		if (!user) {
			return res.status(400).json({ message: 'No user found with that email' });
		}
		if (user.isVerified) {
			return res.status(400).json({ message: 'Email is already verified' });
		}
		// Generate new verification token
		const emailVerificationToken = crypto.randomBytes(32).toString('hex');
		const emailVerificationExpires = Date.now() + verifyEmailTokenExpiry; // 1 hour
		user.emailVerificationToken = emailVerificationToken;
		user.emailVerificationExpires = emailVerificationExpires;
		await user.save();
		const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${emailVerificationToken}&email=${email}`;
		await mailSender(email, 'Verify your email', `<p>Click <a href="${verifyUrl}">here</a> to verify your email. This link expires in 1 hour.</p>`);
		res.json({ message: 'A new verification email has been sent to your email address. Please verify!' });
	} catch (err) {
		console.error("Error in resendVerificationEmail:", err);
		res.status(500).json({ message: 'Server error' });
	}
};
