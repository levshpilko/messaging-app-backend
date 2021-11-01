const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
	userName: { type: String, required: true, unique: true },
	email: { type: String, required: true, unique: true },
	password: { type: String, required: true, minlength: 6 },
	sentMsg: [{ type: mongoose.Types.ObjectId, ref: 'Message' }],
	recievedMsg: [{ type: mongoose.Types.ObjectId, ref: 'Message' }]
});

module.exports = mongoose.model('User', userSchema);
