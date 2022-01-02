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

const ObjectId = require("mongoose").Types.ObjectId;

module.exports.retrieveUser = async (req, res, next) => {};

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
