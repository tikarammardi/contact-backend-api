require('dotenv').config();
const { v4: uuid } = require('uuid');
const { customAlphabet: generate } = require('nanoid');

const { generateJwt } = require('../helpers/generate-jwt');
const { sendEmail } = require('../helpers/mailer');
const User = require('../models/User');
const { userSchema } = require('../helpers/schema');
const CHARACTER_SET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

const REFERRAL_CODE_LENGTH = 8;

const referralCode = generate(CHARACTER_SET, REFERRAL_CODE_LENGTH);

exports.signup = async (req, res) => {
	try {
		const result = await userSchema.validateAsync(req.body);
		if (result.error) {
			console.log(result.error.message);
			return res.json({
				error: true,
				status: 400,
				message: result.error.message
			});
		}
		console.log('result is ', result);
		//Check if the email has been already registered.
		var user = await User.findOne({
			email: result.email
		});

		if (user) {
			return res.json({
				error: true,
				message: 'Email is already in use'
			});
		}

		const hash = await User.hashPassword(result.password);

		const id = uuid(); //Generate unique id for the user.
		result.userId = id;

		delete result.confirmPassword;
		result.password = hash;

		let code = Math.floor(100000 + Math.random() * 900000);

		let expiry = Date.now() + 60 * 1000 * 15; //15 mins in ms

		const sendCode = await sendEmail(result.email, code);

		if (sendCode.error) {
			return res.status(500).json({
				error: true,
				message: "Couldn't send verification email."
			});
		}
		result.emailToken = code;
		result.emailTokenExpires = new Date(expiry);

		//Check if referred and validate code.
		if (result.hasOwnProperty('referrer')) {
			let referrer = await User.findOne({
				referralCode: result.referrer
			});
			if (!referrer) {
				return res.status(400).send({
					error: true,
					message: 'Invalid referral code.'
				});
			}
		}
		result.referralCode = referralCode();
		const newUser = new User(result);
		await newUser.save();

		return res.status(200).json({
			success: true,
			message: 'Registration Success',
			referralCode: result.referralCode
		});
	} catch (error) {
		console.error('signup-error', error);
		return res.status(500).json({
			error: true,
			message: 'Cannot Register'
		});
	}
};

exports.activate = async (req, res) => {
	try {
		const { email, code } = req.body;
		console.log('email and code', email, code);
		if (!email || !code) {
			return res.json({
				error: true,
				status: 400,
				message: 'Please make a valid request'
			});
		}
		const user = await User.findOne({
			email: email,
			emailToken: code,
			emailTokenExpires: { $gt: Date.now() }
		});
		console.log('user found', user);
		if (!user) {
			return res.status(400).json({
				error: true,
				message: 'Invalid details'
			});
		} else {
			if (user.active)
				return res.send({
					error: true,
					message: 'Account already activated',
					status: 400
				});

			user.emailToken = '';
			user.emailTokenExpires = null;
			user.active = true;

			await user.save();

			return res.status(200).json({
				success: true,
				message: 'Account activated.'
			});
		}
	} catch (error) {
		console.error('activation-error', error);
		return res.status(500).json({
			error: true,
			message: error.message
		});
	}
};

exports.login = async (req, res) => {
	try {
		const { email, password } = req.body;

		if (!email || !password) {
			return res.status(400).json({
				error: true,
				message: 'Cannot authorize user.'
			});
		}

		//1. Find if any account with that email exists in DB
		const user = await User.findOne({ email: email });

		// NOT FOUND - Throw error
		if (!user) {
			return res.status(404).json({
				error: true,
				message: 'Account not found'
			});
		}

		//2. Throw error if account is not activated
		if (!user.active) {
			return res.status(400).json({
				error: true,
				message: 'You must verify your email to activate your account'
			});
		}

		//3. Verify the password is valid
		const isValid = await User.comparePasswords(password, user.password);

		if (!isValid) {
			return res.status(400).json({
				error: true,
				message: 'Invalid credentials'
			});
		}

		//Generate Access token

		const { error, token } = await generateJwt(user.email, user.userId);
		if (error) {
			return res.status(500).json({
				error: true,
				message: "Couldn't create access token. Please try again later"
			});
		}
		user.accessToken = token;
		await user.save();

		//Success
		return res.send({
			success: true,
			message: 'User logged in successfully',
			data: user
		});
	} catch (err) {
		console.error('Login error', err);
		return res.status(500).json({
			error: true,
			message: "Couldn't login. Please try again later."
		});
	}
};

exports.forgotPassword = async (req, res) => {
	try {
		const { email } = req.body;
		if (!email) {
			return res.send({
				status: 400,
				error: true,
				message: 'Cannot be processed'
			});
		}
		const user = await User.findOne({
			email: email
		});
		if (!user) {
			return res.send({
				success: true,
				message: 'If that email address is in our database, we will send you an email to reset your password'
			});
		}

		let code = Math.floor(100000 + Math.random() * 900000);
		let response = await sendEmail(user.email, code);

		if (response.error) {
			return res.status(500).json({
				error: true,
				message: "Couldn't send mail. Please try again later."
			});
		}

		let expiry = Date.now() + 60 * 1000 * 15;
		user.resetPasswordToken = code;
		user.resetPasswordExpires = expiry; // 15 minutes

		await user.save();

		return res.send({
			success: true,
			message: 'If that email address is in our database, we will send you an email to reset your password'
		});
	} catch (error) {
		console.error('forgot-password-error', error);
		return res.status(500).json({
			error: true,
			message: error.message
		});
	}
};

exports.resetPassword = async (req, res) => {
	try {
		const { token, newPassword, confirmPassword } = req.body;
		if (!token || !newPassword || !confirmPassword) {
			return res.status(403).json({
				error: true,
				message: "Couldn't process request. Please provide all mandatory fields"
			});
		}
		const user = await User.findOne({
			resetPasswordToken: req.body.token,
			resetPasswordExpires: { $gt: Date.now() }
		});
		if (!user) {
			return res.send({
				error: true,
				message: 'Password reset token is invalid or has expired.'
			});
		}
		if (newPassword !== confirmPassword) {
			return res.status(400).json({
				error: true,
				message: "Passwords didn't match"
			});
		}
		const hash = await User.hashPassword(req.body.newPassword);
		user.password = hash;
		user.resetPasswordToken = null;
		user.resetPasswordExpires = '';

		await user.save();

		return res.send({
			success: true,
			message: 'Password has been changed'
		});
	} catch (error) {
		console.error('reset-password-error', error);
		return res.status(500).json({
			error: true,
			message: error.message
		});
	}
};

exports.referredAccounts = async (req, res) => {
	try {
		const { id, referralCode } = req.decoded;
		const referredAccounts = await User.find({ referrer: referralCode }, { email: 1, referralCode: 1, _id: 0 });
		return res.send({
			success: true,
			accounts: referredAccounts,
			total: referredAccounts.length
		});
	} catch (error) {
		console.error('fetch-referred-error.', error);
		return res.status(500).json({
			error: true,
			message: error.message
		});
	}
};

exports.logout = async (req, res) => {
	try {
		const { id } = req.decoded;

		const user = await User.findOne({ userId: id });
		user.accessToken = '';

		await user.save();

		return res.send({ success: true, message: 'User Logged out' });
	} catch (error) {
		console.error('user-logout-error', error);
		return res.status(500).json({
			error: true,
			message: error.message
		});
	}
};
