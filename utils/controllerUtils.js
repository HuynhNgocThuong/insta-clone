const handlebars = require("handlebars");
const fs = require("fs");
const nodemailer = require("nodemailer");
const { template } = require("handlebars");
const User = require("../models/User");
module.exports.retrieveComments = async () => {};
/**
 * @function sendEmail
 */
module.exports.sendEmail = async (to, subject, template) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USERNAME, // generated ethereal user
      pass: process.env.EMAIL_PASSWORD, // generated ethereal password
    },
  });
  // send mail with defined transport object
  await transporter.sendMail({
    from: '"Instaclone Support" <support@instaclone.net>', // sender address
    to: to, // list of receivers
    subject: subject, // Subject line
    html: template, // html body
  });
};
/**
 * Sends a confirmation email to an email address
 */
module.exports.sendConfirmationEmail = async (
  username,
  email,
  confirmationToken
) => {
  if (process.env.NODE_ENV === "production") {
    try {
      const source = fs.readFileSync(
        "templates/confirmationEmail.html",
        "utf8"
      );
      template = handlebars.compile(source);
      const html = template({
        username: username,
        confirmationUrl: `${process.env.HOME_URL}/confirm/${confirmationToken}`,
        url: `${process.env.HOME_URL}`,
      });
      await this.sendEmail(email, "Confirm your insta clone account.", html);
    } catch (error) {
      console.log(error);
    }
  }
};
module.exports.formatCloudinaryUrl = () => {};
module.exports.sendCommentNotification = () => {};
module.exports.sendMentionNotification = () => {};
/**
 * Generates a unique username based on the base username
 * @function generateUniqueUsername
 * @param {String} baseUsername The first part of the username to add a random number to
 */
module.exports.generateUniqueUsername = async (baseUsername) => {
  let uniqueUsername = undefined;
  try {
    while (!uniqueUsername) {
      const username = baseUsername + Math.floor(Math.random(1000) * 9999 + 1);
      const user = await User.findOne({ username });
      if (!user) {
        uniqueUsername = username;
      }
    }
    return uniqueUsername;
  } catch (error) {
    console.log(error);
  }
};
module.exports.formatCloudinaryUrl = (url, size, thumb) => {
  // "secure_url": "https://res.cloudinary.com/demo/image/upload/c_pad,h_300,w_400/v1570979139/eneivicys42bq5f2jpn2.jpg"
  const thumbnailUrl = formatCloudinaryUrl;
};
module.exports.populatePostsPipeline = [];
