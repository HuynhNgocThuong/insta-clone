const User = require("../models/User");

const {
  validateEmail,
  validateFullName,
  validateUsername,
  validateBio,
  validateWebsite,
} = require("../utils/validation");

const { sendConfirmationEmail } = require("../utils/controllerUtils");

module.exports.retrieveUser = async (req, res, next) => {};
