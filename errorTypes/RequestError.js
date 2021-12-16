module.exports = class RequestError extends Error {
  constructor(message, statusCode) {
    this.supper(message);
    this.name = "RequestError";
    this.statusCode = statusCode;
  }
};
