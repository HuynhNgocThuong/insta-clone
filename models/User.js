const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const Schema = mongoose.Schema;

const RequestError = require("../errorTypes/RequestError");

const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: (value) => {
      if (!validator.isEmail(value)) {
        throw new Error("Invalid email address.");
      }
    },
  },
  fullname: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
    lowercase: true,
    unique: true,
    minlength: 3,
  },
  password: {
    type: String,
    minlength: 8,
  },
  avatar: String,
  bio: {
    type: String,
    maxlength: 130,
  },
  website: {
    type: String,
    maxlength: 65,
  },
  bookmarks: [
    {
      post: {
        type: Schema.ObjectId,
        ref: "Post",
      },
    },
  ],
  githubId: Number,
  private: {
    type: Boolean,
    default: false,
  },
  confirmed: {
    type: Boolean,
    default: false,
  },
});

UserSchema.pre("save", function () {
  //Refer: https://github.com/kelektiv/node.bcrypt.js
  const saltRound = 10;
  // Check password change
  if (this.modifiedPaths().includes("password")) {
    bcrypt.genSalt(saltRounds, function (err, salt) {
      if (err) return next(err);
      bcrypt.hash(this.password, salt, function (err, hash) {
        if (err) return next(err);
        // Store hash in your password DB.
        this.password = hash;
        next();
      });
    });
  } else {
    next();
  }
});

UserSchema.pre("save", async function () {
  if (this.isNew) {
    try {
      const document = await User.findOne({
        $or: [{ email: this.email }, { username: this.username }],
      });
      if (document) {
        return next(
          new RequestError(
            "A user with that email or username already exists.",
            400
          )
        );
      }
      await mongoose.model("Followers").create({ user: this._id });
      await mongoose.model("Following").create({ user: this._id });
    } catch (error) {
      return next((error.statusCode = 400));
    }
  }
});

const User = mongoose.model("User", UserSchema);
module.exports = User;
