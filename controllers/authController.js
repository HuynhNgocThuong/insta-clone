const User = require("../models/User");
const ConfirmationToken = require("../models/ConfirmationToken");
const crypto = require("crypto");
const jwt = require("jwt-simple");
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

// module.exports.verifyJwt = (token) => {
//   try {
//     const id = jwt.decode(token, process.env.JWT_SECRET);
//     const user = await User.findOne(
//       { _id: id },
//       "email username avatar bookmarks bio fullName confirmed website"
//     )
//       .then((user) => user)
//       .catch((error) => "Not authorized.");
//   } catch (error) {
//     return "Not authorized.";
//   }
// };

module.exports.verifyJwt = (token) => {
  return new Promise(async (resolve, reject) => {
    try {
      const id = jwt.decode(token, process.env.JWT_SECRET).id;
      const user = await User.findOne(
        { _id: id },
        "email username avatar bookmarks bio fullName confirmed website"
      );
      if (user) {
        return resolve(user);
      } else {
        reject("Not authorized.");
      }
    } catch (err) {
      return reject("Not authorized.");
    }
  });
};

module.exports.register = async (req, res, next) => {
  const { username, fullName, password, email } = req.body;
  const usernameError = validateUsername(username);
  if (usernameError) {
    return res.status(400).json({ success: false, message: usernameError });
  }
  const fullNameError = validateFullName(fullName);
  if (fullNameError) {
    return res.status(400).json({ succes: false, message: fullNameError });
  }
  const emailError = validateEmail(email);
  if (emailError) {
    return res.status(400).json({ succes: false, message: emailError });
  }
  const passwordError = validatePassword(password);
  if (passwordError) {
    return res.status(400).json({ succes: false, message: passwordError });
  }
  try {
    // create ConfirmationToken
    user = User({ username, fullName, email, password });
    confirmationToken = ConfirmationToken({
      user: user._id,
      token: crypto.randomBytes(20).toString("hex"),
    });
    console.log(confirmationToken);
    // Save data user and confirmation tolen
    await user.save();
    await confirmationToken.save();

    // Response to client
    res.status(200).json({
      user: {
        email: user.email,
        username: user.username,
      },
      token: jwt.encode({ id: user._id }, process.env.JWT_SECRET),
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
  sendConfirmationEmail(user.username, user.email, confirmationToken.token);
};

module.exports.loginAuthentication = async (req, res, next) => {
  const { authorization } = req.headers;
  const { usernameOrEmail, password } = req.body;
  if (authorization) {
    try {
      const user = await this.verifyJwt(authorization);
      return res.send({
        user,
        token: authorization,
      });
    } catch (error) {
      return res.status(401).json({ success: false, message: error });
    }
  }
  if (!usernameOrEmail || !password) {
    return res.status(400).json({
      success: false,
      message: "The credentials you provided are incorrect, please try again.",
    });
  }
  try {
  } catch (error) {
    next(error);
  }
};

module.exports.githubLoginAuthentication = () => {};

module.exports.changePassword = () => {};

module.exports.requiredAuth = async (req, res, next) => {
  const { authorization } = req.headers;
};

module.exports.optionalAuth = () => {};
