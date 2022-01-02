// Model
const User = require("../models/User");
const Following = require("../models/Following");
const Followers = require("../models/Follwers");
const Notification = require("../models/Notification");
const {
  validateEmail,
  validateFullName,
  validateUsername,
  validateBio,
  validateWebsite,
} = require("../utils/validation");
const socketHandler = require("../handlers/socketHandler");
const { sendConfirmationEmail } = require("../utils/controllerUtils");
const ConfirmationTokenModel = require("../models/ConfirmationToken");
const cloudinary = require("cloudinary").v2;
const ObjectId = require("mongoose").Types.ObjectId;
const fs = require("fs");

/**
 * @description: Get information of a user, not the user logining
 * @logic:
 * - Find user with username
 * - Get follower of user
 * - Get following of user
 * - Get post of user
 */
module.exports.retrieveUser = async (req, res, next) => {
  const user = res.locals.user;
  const { username } = req.params;
  try {
    const user = await User.findOne(
      { username },
      "username fullName avatar bio bookmarks _id website"
    );
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Could not find a user with that username.",
      });
    }

    const posts = await Post.aggregate({});

    const followersDocument = await Followers.findOne({
      user: ObjectId(user._id),
    });
    const followingDocument = await Following.findOne({
      user: ObjectId(user._id),
    });
  } catch (error) {
    next(error);
  }
};

module.exports.retrievePost = async (req, res, next) => {};

module.exports.bookmarkPost = async (req, res, next) => {};

module.exports.followUser = async (req, res, next) => {
  const { userId } = req.params;
  const user = res.locals.user;
  try {
    const userToFollow = await User.findById(userId);
    console.log("User follow: ", userToFollow);
    if (!userToFollow) {
      return res
        .status(400)
        .json({ success: false, error: "Could not find a user with that id." });
    }
    // Update user following for user
    const followingUpdate = await Following.updateOne(
      { user: user._id, "following.user": { $ne: userId } },
      { $push: { following: { user: userId } } }
    );
    // Update user follower for user userId
    const followerUpdate = await Followers.updateOne(
      { user: userId, "followers.user": { $ne: user._id } },
      { $push: { followers: { user: user._id } } }
    );
    console.log("followerUpdate:", followerUpdate);
    console.log("follwingUpdate:", followingUpdate);
    if (!followingUpdate.modifiedCount || !followerUpdate.modifiedCount) {
      // if (!followingUpdate.ok || !followerUpdate.ok) {
      //   return res
      //     .status(500)
      //     .send({ error: "Could not follow user please try again later." });
      // }
      // Nothing was modified in the above query meaning that the user is already following
      // Unfollow instead
      const followerUnfollowUpdate = await Followers.updateOne(
        { user: userId },
        { $pull: { followers: { user: user._id } } }
      );
      const followingUnfollowUpdate = await Following.updateOne(
        { user: user._id },
        { $pull: { following: { user: userId } } }
      );
      console.log("followerUnfollowUpdate:", followerUpdate);
      console.log("followingUnfollowUpdate:", followingUpdate);
      if (
        !followerUnfollowUpdate.modifiedCount ||
        !followingUnfollowUpdate.modifiedCount
      ) {
        return res
          .status(500)
          .send({ error: "Could not Unfollow user please try again later." });
      }
      return res.send({ success: true, operation: "Unfollow user." });
    }

    // Notification
    const notification = new Notification({
      notificationType: "follow",
      sender: user._id,
      receiver: userId,
      date: Date.now(),
    });

    const sender = await User.findById(user.id, "username avatar");
    // Note
    const isFollowing = await Following.findOne({
      user: userId,
      "following.user": user._id,
    });
    await notification.save();

    // Push into socket
    socketHandler.sendNotification(req, {
      notificationType: "follow",
      sender: {
        _id: sender._id,
        username: sender.username,
        avatar: sender.avatar,
      },
      receiver: userId,
      date: notification.date,
      isFollowing: !!isFollowing,
    });
  } catch (error) {
    next(error);
  }
};
/**
 * Retrieves either who a specific user follows or who is following the user.
 * Also retrieves whether the requesting user is following the returned users
 * @function retrieveRelatedUsers
 */
module.exports.retrieveRelatedUsers = async (
  user,
  userId,
  offset,
  follwers
) => {
  const pipeline = [
    {
      $match: { user: ObjectId(userId) },
    },
    {
      $lookup: {
        from: "users",
        let: followers
          ? { userId: "$followers.user" }
          : { userId: "$following.user" },
        pipeline: [
          {
            $match: {
              $expr: { $in: ["$_id", "$$userId"] },
            },
          },
          {
            $skip: Number(offset),
          },
          {
            $limit: 10,
          },
        ],
        as: "users",
      },
    },
    {
      $lookup: {
        from: "followers",
        localField: "users._id",
        foreignField: "user",
        as: "userFollowers",
      },
    },
    {
      $project: {
        "users._id": true,
        "users.username": true,
        "users.avatar": true,
        "users.fullName": true,
        userFollowers: true,
      },
    },
  ];
  const aggregation = followers
    ? await Followers.aggregate(pipeline)
    : await Following.aggregate(pipeline);
  // Make a set to store the IDs off the followed users
  const followedUsers = new Set();
  // loop through every follower and add the id to the set if the user's id is in the array
  aggregation[0].userFollwers.forEach((followingUser) => {
    if (
      !!followingUser.followers.find(
        (follower) => String(follower.user) === String(user._id)
      )
    ) {
      followedUsers.add(String(followingUser.user));
    }
  });
  // Add the isFollowing key to the following object with a value
  // depending on the outcome of the loop above
  aggregation[0].users.forEach((followingUser) => {
    followingUser.isFollowing = followedUsers.has(String(followingUser._id));
  });

  return aggregation[0].users;
};

module.exports.retrieveFollowers = async (req, res, next) => {
  const { userId, offset = 0 } = req.params;
  const user = res.locals.user;
};

module.exports.retrieveFollowing = async (req, res, next) => {
  const { userId, offset = 0 } = req.params;
  const user = res.locals.user;
};

/**
 * @description: Seach user
 * @param
 * @argument
 * @returns
 */
// TODO: Test function search user
module.exports.searchUsers = async (req, res, next) => {
  const { userId, offset = 0 } = req.params;
  const user = res.locals.user;
  if (!userId) {
    return res
      .status(400)
      .json({ success: false, error: "Please provide a user to search for." });
  }
  try {
    const users = await User.aggregate([
      {
        $match: {
          username: { $regex: new RegExp(username), $option: "i" },
        },
      },
      {
        $lookup: {
          from: "followers",
          localField: "_id",
          foreignField: "user",
          as: "followers",
        },
      },
      { $unwind: "$follwers" },
      {
        $addFields: {
          followersCount: { $size: "$followers.followers" },
        },
      },
      { $sort: { followersCount: -1 } },
      { $skip: Number(offset) },
      { $limit: 10 },
      {
        $project: {
          _id: true,
          username: true,
          avatar: true,
          fullName: true,
        },
      },
    ]);
    if (users.length === 0) {
      return res
        .status(404)
        .send({ error: "Could not find any users matching the criteria." });
    }
    return res.send(users);
  } catch (error) {
    next(error);
  }
};
/**
 * @description: Confirm account when account was accepted by email
 * @param {*}
 * @param {*}
 * @param {*}
 */
//TODO: Not yet implement send email
module.exports.confirmUser = async (req, res, next) => {
  const { token } = req.body;
  const user = res.locals.user;
  try {
    const confirmationToken = await ConfirmationToken.findOne({
      token,
      user: user._id,
    });
    if (!confirmationToken) {
      return res
        .status(404)
        .send({ error: "Invalid or expired confirmation link." });
    }
    await ConfirmationToken.deleteOne({ token, user: user._id });
    await User.updateOne({ _id: user._id }, { confirmed: true });
    return res.send();
  } catch (error) {
    next(error);
  }
};
/**
 * @description: Change avatar of user
 * @logic: {
 * config to cloudinary
 * upload file onto cloudinary
 * update table user with field avatar
 * }
 * @param {*}
 * @param {*}
 * @param {*}
 */
// Refer: https://github.com/expressjs/multer
module.exports.changeAvatar = async (req, res, next) => {
  const user = res.locals.user;

  console.log(req.file);
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, error: "Please provide the image to upload." });
  }
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  try {
    console.log(req.file.path);
    const response = await cloudinary.uploader.upload(req.file.path, {
      width: 200,
      height: 200,
      gravity: "face",
      crop: "thumb",
    });
    console.log(response);
    // fs.unlinkSync(req.file.path);
    const avatarUpdate = await User.updateOne(
      { _id: user._id },
      { avatar: response.secure_url }
    );
    if (!avatarUpdate.modifiedCount) {
      throw new Error("Could not update user avatar.");
    }
    return res.json({ success: true, avatar: response.secure_url });
  } catch (error) {
    next(error);
  }
};

/**
 * @description: Remove avatar of user
 * @logic: {
 * update table user with field avatar is empty
 * }
 * @param {*}
 * @param {*}
 * @param {*}
 */
module.exports.removeAvatar = async (req, res, next) => {
  const user = req.locals.user;
  try {
    const avatarUpdate = await User.updateOne(
      { _id: user._id },
      { $unset: { avatar: "" } }
    );
    if (!avatarUpdate.modifiedCount) {
      next(error);
    }
    return res.status(204).send({ message: "Remove avatar successful." });
  } catch (error) {
    next(error);
  }
};
/**
 * @description: Update profile of user
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @return {*}
 */
//TODO: Done
module.exports.updateProfile = async (req, res, next) => {
  const user = res.locals.user;
  const { fullName, username, website, bio, email } = req.body;
  let confirmationToken = undefined;
  let updatedFields = {};
  /**
   * Update: fullName, username, email, website, bio
   */
  try {
    const userDocument = await User.findOne({ _id: user._id });
    if (fullName) {
      const fullNameError = validateFullName(fullName);
      if (fullNameError)
        return res.status(400).json({ success: false, error: fullNameError });
      userDocument.fullName = fullName;
      updatedFields.fullName = fullName;
    }
    if (username) {
      const usernameError = validateUsername(username);
      if (usernameError)
        return res.status(400).json({ success: false, error: usernameError });
      // Make sure username to update to is not the current one
      if (username !== user.username) {
        const existingUser = await User.findOne({ username });
        if (existingUser)
          return res
            .status(400)
            .json({ success: false, error: "Please choose another username." });
        userDocument.username = username;
        updatedFields.username = username;
      }
    }
    if (website) {
      const websiteError = validateWebsite(website);
      if (websiteError)
        return res.status(400).json({ success: false, error: websiteError });
      if (!website.includes("http://") && !website.includes("https://")) {
        userDocument.website = "https://" + website;
        updatedFields.website = "https://" + website;
      }
      userDocument.website = website;
      updatedFields.website = website;
    }
    if (bio) {
      const bioError = validateBio(bio);
      if (bioError)
        return res.status(400).json({ success: false, error: bioError });
      userDocument.bio = bio;
      updatedFields.bio = bio;
    }
    if (email) {
      const emailError = validateEmail(email);
      if (emailError)
        return res.status(400).json({ success: false, error: emailError });
      // Make sure the email to update to is not the current one
      if (email !== user.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res.status(400).json({ success: false, error: "" });
        }
      }
    }
    const updatedUser = await userDocument.save();
    res.send(updatedFields);
    if (email && email !== user.email) {
      sendConfirmationEmail(
        updatedUser.username,
        updatedUser.email,
        confirmationToken.token
      );
    }
  } catch (error) {
    next(error);
  }
};

module.exports.retrieveSuggestedUsers = async (req, res, next) => {};
