const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const placeSchema = new Schema({
	content: { type: String, required: true },
	subject: { type: String, default: 'None' },
	read: { type: Boolean, default: false },
	creationDate: { type: Date, required: true },
	sender: { type: mongoose.Types.ObjectId, required: true, ref: 'User' },
	receiver: { type: mongoose.Types.ObjectId, required: true, ref: 'User' }
});

module.exports = mongoose.model('Message', placeSchema);
