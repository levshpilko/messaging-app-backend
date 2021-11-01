const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

const HttpError = require('../models/http-error');
const User = require('../models/user');

exports.signup = async (req, res, next) => {
	//check if req has any input errors
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return next(
			new HttpError('Invalid input, please check yout data.', 422, 'input')
		);
	}

	const { userName, email, password } = req.body;

	//check for existing email or user name
	let existingEmail, existingUserName;
	try {
		existingEmail = await User.findOne({ email });
		existingUserName = await User.findOne({ userName });
	} catch (err) {
		return next(new HttpError('Sign up failed, please try again later.', 500));
	}

	if (existingEmail)
		return next(
			new HttpError(
				'User already exists, please enter a different email address',
				422,
				'email'
			)
		);
	else if (existingUserName)
		return next(
			new HttpError(
				'User Name already exists, please choose a different user name',
				422,
				'userName'
			)
		);

	//create new user
	let createdUser;
	try {
		createdUser = new User({
			userName,
			email,
			password: await bcrypt.hash(password, 12),
			sentMsg: [],
			recievedMsg: []
		});

		await createdUser.save();

		token = jwt.sign(
			{ userId: createdUser.id, email: createdUser.email },
			process.env.JWT_KEY,
			{ expiresIn: '1h' }
		);
	} catch (err) {
		return next(new HttpError('Signup failed, please try again.', 500));
	}

	res.status(201).json({
		userId: createdUser.id,
		userName: createdUser.userName,
		email: createdUser.email,
		token
	});
};

exports.login = async (req, res, next) => {
	const { email, password } = req.body;
	//check for existing user and correct password
	let existingUser;
	let isValidPassword = false;

	try {
		existingUser = await User.findOne({ email });
		if (!existingUser) {
			return next(
				new HttpError('Login failed, invalid email address', 403, 'email')
			);
		}

		isValidPassword = await bcrypt.compare(password, existingUser.password);
		if (!isValidPassword) {
			return next(
				new HttpError('Login failed, invalid password', 403, 'password')
			);
		}
	} catch (err) {
		return next(new HttpError('Login failed, please try again later.', 500));
	}

	token = jwt.sign(
		{ userId: existingUser.id, email: existingUser.email },
		process.env.JWT_KEY,
		{ expiresIn: '1h' }
	);
	res.status(200).json({
		userId: existingUser.id,
		userName: existingUser.userName,
		email: existingUser.email,
		token
	});
};
