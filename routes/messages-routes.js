const express = require('express');
const { check } = require('express-validator');

const messagesControllers = require('../controllers/messages-controllers');
const checkAuth = require('../middleware/check-auth');

const router = express.Router();

router.use(checkAuth);

// ROUTES FOR /api/messages/
router.get('/user/:uid', messagesControllers.getMessagesByUserId);

router.patch('/:mid', messagesControllers.readMessage);

router.post(
	'/',
	[
		check('content').trim().isLength({ min: 5 }),
		check('sender').not().isEmpty(),
		check('receiver').not().isEmpty()
	],
	messagesControllers.createMessage
);

router.delete('/:mid', messagesControllers.deleteMessage);

module.exports = router;
