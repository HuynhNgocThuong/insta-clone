const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const Schema = mongoose.Schema;
const Followers = require("./Follwers");
const Following = require("./Following");
const RequestError = require("../errorTypes/RequestError");

const UserSchema = new Schema(
  {
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
    fullName: {
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
  },
  {
    versionKey: false,
  }
);

UserSchema.pre("save", function (next) {
  //Refer: https://github.com/kelektiv/node.bcrypt.js
  const saltRounds = 10;
  // Check password change
  if (this.modifiedPaths().includes("password")) {
    bcrypt.genSalt(saltRounds, (err, salt) => {
      if (err) return next(err);
      bcrypt.hash(this.password, salt, (err, hash) => {
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

UserSchema.pre("save", async function (next) {
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
      await Followers.create({ user: this._id });
      await Following.create({ user: this._id });
    } catch (error) {
      console.log(error);
      return next((error.statusCode = 400));
    }
  }
});

const User = mongoose.model("User", UserSchema);
module.exports = User;
