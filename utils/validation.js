module.exports.validateEmail = (email) => {
  if (
    !email ||
    !email.match(
      /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    )
  ) {
    return "Enter a valid email address.";
  }
  return false;
};
module.exports.validateFullName = (fullName) => {
  if (!fullName) {
    return "Enter a valid name.";
  }
  return false;
};
module.exports.validateUsername = (userName) => {
  /* 
        Usernames can only have: 
        - Lowercase Letters (a-z) 
        - Uppercase Letters (A-Z)
        - Numbers (0-9)
        - Dots (.)
        - Underscores (_)
  */
  if (!userName) {
    return "Enter a valid username.";
  } else if (userName.length > 30 || userName.length < 3) {
    return "Please choose a username between 3 and 30 characters.";
  } else if (!userName.match(/^[a-zA-Z0-9\_.]+$/)) {
    return "A Username can only contain the following: letters A-Z, number 0-9 the symbols _ .";
  }
  return false;
};
module.exports.validatePassword = (password) => {
  /*
        /^
        (?=.*\d)          // should contain at least one digit
        (?=.*[a-z])       // should contain at least one lower case
        (?=.*[A-Z])       // should contain at least one upper case
        [a-zA-Z0-9]{6,}   // should contain at least 6 from the mentioned characters
        $/
    */
  if (!password) {
    return "Enter a valid password.";
  } else if (password.length < 3) {
    return "For security purposes we require a password to be at least 6 characters.";
  } else if (
    !password.match(/^(?=.*[A-Z])(?=.*[!@#$&*])(?=.*[0-9])(?=.*[a-z]).{6,}$/)
  ) {
    return "A password needs to have at least one uppercase letter, one lowercase letter, one special character and one number.";
  }
  return false;
};
module.exports.validateBio = (bio) => {
  if (bio.length > 120) {
    return "Your bio has to be 120 characters or less.";
  }
  return false;
};
module.exports.validateWebsite = (website) => {
  if (
    !website.match(
      /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/
    )
  ) {
    return "Please provide a valid website.";
  }
  return false;
};
