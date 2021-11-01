const express = require('express');
const mongoose = require('mongoose');

require('dotenv').config();

const messagesRoutes = require('./routes/messages-routes');
const usersRoutes = require('./routes/users-routes');
const HttpError = require('./models/http-error');

var cors = require('cors');

var app = express();

app.use(cors());

app.use(express.json());

app.use('/api/messages', messagesRoutes);
app.use('/api/users', usersRoutes);

app.use((req, res, next) => {
	const error = new HttpError('Could not find this route.', 404);
	throw error;
});

app.use((error, req, res, next) => {
	if (res.headerSent) {
		return next(error);
	}
	res.status(error.code || 500);
	res.json({
		message: error.message || 'An unknown error occurred!',
		errorType: error.type || 'general'
	});
});

mongoose
	.connect(
		`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.gat3a.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`,
		{
			useNewUrlParser: true,
			useUnifiedTopology: true,
			useCreateIndex: true
		}
	)
	.then(() => {
		console.log('******************DB CONNECTED!******************');
		app.listen(process.env.PORT || 4000);
	})
	.catch(err => console.log(err));
