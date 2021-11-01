class HttpError extends Error {
	constructor(message, errorCode, errorType) {
		super(message);
		this.code = errorCode;
		this.type = errorType;
	}
}

module.exports = HttpError;
