const {
  sendConfirmationEmail,
  generateUniqueUsername,
} = require("../utils/controllerUtils");

const {
  validateEmail,
  validateFullName,
  validateUsername,
  validatePassword,
} = require("../utils/validation");

module.exports.verifyJwt = () => {};

module.exports.register = async () => {};

module.exports.loginAuthentication = () => {};

module.exports.githubLoginAuthentication = () => {};

module.exports.changePassword = () => {};

module.exports.requiredAuth = () => {};

module.exports.optionalAuth = () => {};
