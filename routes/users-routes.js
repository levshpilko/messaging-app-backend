const express = require('express');
const { check } = require('express-validator');

const usersControllers = require('../controllers/users-controllers');

const router = express.Router();

// ROUTES FOR /api/users/
router.post(
	'/signup',
	[
		check('userName').not().isEmpty(),
		check('email').normalizeEmail().isEmail(),
		check('password').isLength({ min: 6 })
	],
	usersControllers.signup
);
router.post('/login', usersControllers.login);

module.exports = router;
