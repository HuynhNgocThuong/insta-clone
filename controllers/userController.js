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

const { sendConfirmationEmail } = require("../utils/controllerUtils");

module.exports.retrieveUser = async (req, res, next) => {};

module.exports.retrievePost = async (req, res, next) => {};

module.exports.bookmarkPost = async (req, res, next) => {};

module.exports.followUser = async (req, res, next) => {
  const { userId } = req.params;
  const user = req.locals.user;
  try {
    const userToFollow = await User.findById(userId);
    if (!userToFollow) {
      return res
        .status(400)
        .json({ success: false, error: "Could not find a user with that id." });
    }
    // Update user following for user
    const followingUpdate = await Following.updateOne(
      {
        user: user_id,
        "follwing.user": { $ne: userId },
      },
      {
        $push: { follwing: { user: userId } },
      }
    );
    // Update user follower for user userId
    const followerUpdate = await Follower.updateOne(
      {
        user: userId,
        "followers.user": { $ne: user._id },
      },
      {
        $push: { followers: { user: user._id } },
      }
    );
    if (!followingUpdate.nModified || !followerUpdate.nModified) {
      if (!followingUpdate.ok || !followerUpdate.ok) {
        return res
          .status(500)
          .send({ error: "Could not follow user please try again later." });
      }
      // Nothing was modified in the above query meaning that the user is already following
      // Unfollow instead
      const followerUnfollowUpdate = await Followers.updateOne(
        {
          user: userId,
          "followers.user": { $ne: user._id },
        },
        {
          $pull: { followers: { user: user._id } },
        }
      );
      const followingUnfollowUpdate = await Following.updatOne(
        {
          user: user_id,
          "follwing.user": { $ne: userId },
        },
        {
          $pull: { follwing: { user: userId } },
        }
      );
      if (!followerUnfollowUpdate.ok || !followingUnfollowUpdate.ok) {
        return res
          .status(500)
          .send({ error: "Could not Unfollow user please try again later." });
      }
      return res.send({ success: true, operation: "unfollow" });
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
    const isFollowing = await Follwing.findOne({
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

module.exports.retrieveRelatedUsers = async (req, res, next) => {};

module.exports.retrieveFollowers = async (req, res, next) => {
  const { userId, offset = 0 } = req.params;
  const user = res.locals.user;
};

module.exports.retrieveFollowing = async (req, res, next) => {
  const { userId, offset = 0 } = req.params;
  const user = res.locals.user;
};

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

module.exports.confirmUser = async (req, res, next) => {};

module.exports.changeAvatar = async (req, res, next) => {};

module.exports.removeAvatar = async (req, res, next) => {};
/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @return {*}
 */
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
        if (emailEror)
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
      res.send(updateFields);
      if (email && email !== user.email) {
        sendConfirmationEmail(
          updatedUser.username,
          updatedUser.email,
          confirmationToken.token
        );
      }
    }
  } catch (error) {
    next(error);
  }
};

module.exports.retrieveSuggestedUsers = async (req, res, next) => {};
