const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const HttpError = require('../models/http-error');
const Message = require('../models/message');
const User = require('../models/user');

exports.getMessagesByUserId = async (req, res, next) => {
	const userId = req.params.uid;
	const onlyUnreadMsgs = req.query.unread;
	const onlySentMsgs = req.query.sent;
	let userMessages;

	if (userId !== req.userData.userId) {
		return next(new HttpError('Unauthorized!', 403));
	}

	try {
		if (onlySentMsgs) {
			//get only messages sent
			userMessages = await Message.find({
				sender: userId
			})
				.populate('receiver', 'userName')
				.populate('sender', 'userName');
		} else if (onlyUnreadMsgs) {
			//get only unread messages
			userMessages = await Message.find({
				receiver: userId,
				read: false
			})
				.populate('receiver', 'userName')
				.populate('sender', 'userName');
		} else {
			//get all messages for the user
			userMessages = await Message.find({ receiver: userId })
				.populate('receiver', 'userName')
				.populate('sender', 'userName');
		}
	} catch (err) {
		return next(
			new HttpError(
				'Something went wrong. Please check the user id and try again.',
				500
			)
		);
	}
	res.json(userMessages);
};

exports.readMessage = async (req, res, next) => {
	const messageId = req.params.mid;

	let message;
	try {
		message = await Message.findById(messageId);
		if (!message)
			return next(new HttpError('Message not found', 404, 'Message'));
	} catch (err) {
		return next(new HttpError('Something went wrong, please try again.', 500));
	}

	if (message.receiver !== req.userData.userId) {
		return next(new HttpError('Unauthorized!', 403));
	}

	message.read = true;

	try {
		await message.save();
	} catch (err) {
		return next(
			new HttpError('Something went wrong, please try again later.', 500)
		);
	}
	res.status(200).json({ message: message.toObject({ getters: true }) });
};

exports.createMessage = async (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return next(
			new HttpError('Invalid input, please check yout data.', 422, 'input')
		);
	}

	const { sender, receiver, content, subject } = req.body;
	let senderUser, receiverUser, newMsg;

	try {
		senderUser = await User.findById(sender);

		receiverUser = await User.findOne({ userName: receiver });

		if (!senderUser) {
			return next(
				new HttpError(
					'Could not find a user for provided sender id.',
					404,
					'sender'
				)
			);
		}
		if (!receiverUser) {
			return next(
				new HttpError(
					'Could not find a user for provided receiver name. Please try a different user name',
					404,
					'receiver'
				)
			);
		}

		newMsg = new Message({
			sender,
			receiver: receiverUser.id,
			content,
			subject,
			creationDate: new Date(Date.now())
		});

		const session = await mongoose.startSession();
		session.startTransaction();

		await newMsg.save({ session });

		senderUser.sentMsg.push(newMsg);
		await senderUser.save({ session });

		receiverUser.recievedMsg.push(newMsg);
		await receiverUser.save({ session });

		await session.commitTransaction();
	} catch (err) {
		return next(
			new HttpError('Creating message failed, please try again.', 500)
		);
	}
	res.status(201).json({
		content,
		subject,
		sender: senderUser.userName,
		receiver
	});
};

exports.deleteMessage = async (req, res, next) => {
	const messageId = req.params.mid;

	let message;

	try {
		message = await Message.findById(messageId)
			.populate('sender')
			.populate('receiver');
		if (!message) {
			return next(new HttpError('Message not found.', 404));
		}
	} catch (err) {
		return next(new HttpError('Something went wrong, message not found.', 500));
	}

	if (message.sender.id !== req.userData.userId) {
		return next(
			new HttpError('You are not allowed to delete this message.', 401)
		);
	}

	try {
		const session = await mongoose.startSession();
		session.startTransaction();

		await message.remove({ session });

		message.sender.sentMsg.pull(message);
		await message.sender.save({ session });

		message.receiver.recievedMsg.pull(message);
		await message.receiver.save({ session });

		await session.commitTransaction();
	} catch (err) {
		return next(
			new HttpError('Something went wrong, message was not removed.', 500)
		);
	}

	res.status(200).json({ message: 'Message was deleted' });
};
