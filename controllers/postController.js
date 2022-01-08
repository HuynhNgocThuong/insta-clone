// Middleware
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const ObjectId = require("mongoose").Types.ObjectId;
const axios = require("axios");
const linkify = require("linkifyjs");
// Model
const Post = require("../models/Post");
const PostVote = require("../models/PostVote");
const Followers = require("../models/Follwers");
// Util
const {
  formatCloudinaryUrl,
  retrieveComments,
  populatePostsPipeline,
} = require("../utils/controllerUtils");
const socketHandler = require("../handlers/socketHandler");
const filters = require("../utils/filters");

module.exports.createPost = async (req, res, next) => {
  const user = res.locals.user;
  const { caption, filter: filterName } = req.body;
  let post = undefined;
  const filterObject = filters.find((filter) => filter.name === filterName);
  const hashtags = [];

  // Refer: https://github.com/Hypercontext/linkifyjs
  // Refer: https://linkify.js.org/docs/
  // Get all hashtag from caption
  linkify.find(caption).forEach((result) => {
    if (result.type === "hashtag") {
      hashtags.push(result.value.substring(1));
    }
  });
  // Check file picture from caption
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "Please provide the image to upload." });
  }
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  try {
    const response = await cloudinary.uploader.upload(req.file.path);
    const moderationResponse = await axios.get(
      `https://api.moderatecontent.com/moderate/?key=${process.env.MODERATECONTENT_API_KEY}&url=${response.secure_url}`
    );
    if (moderationResponse.data.error) {
      return res.status(500).json({
        success: false,
        message: "error moderating image, please try again later.",
      });
    }
    if (moderationResponse.data.rating_index > 2) {
      return res.status(403).send({
        error: "The content was deemed too explicit to upload.",
      });
    }
    // Image icon on instagram
    const thumbnailUrl = formatCloudinaryUrl(
      response.secure_url,
      {
        width: 400,
        height: 400,
      },
      true
    );
    // Refer: https://www.geeksforgeeks.org/node-js-fs-unlinksync-method/
    fs.unlinkSync(req.file.path);

    // Save post and postvote data into mongodb
    post = new Post({
      image: response.secure_url,
      thumbnailUrl: thumbnailUrl,
      filter: filterObject ? filterObject.filter : "",
      caption,
      author: user._id,
      hashtags,
    });
    const postVote = new PostVote({
      post: post._id,
    });
    await post.save();
    await postVote.save();

    res.status(201).json({
      success: true,
      data: {
        ...post.toObject(),
        postVotes: [],
        comments: [],
        author: { avatar: user.avatar, username: user.username },
      },
    });
  } catch (error) {
    next(error);
  }

  // Inform to all followers through socket io
  try {
    const followersDocument = await Followers.find({ user: user._id });
    // All follers of user
    const followers = followersDocument[0].followers;
    const postObject = {
      ...post.toObject(),
      author: { username: user.username, avatar: user.avatar },
      commentData: { commentCount: 0, comments: [] },
      postVotes: [],
    };
    // Send post to all io.user who connected socket io
    followers.forEach((follower) => {
      socketHandler.sendPost(req, postObject, followers.user);
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports.deletePost = async (req, res, next) => {
  const { postId } = req.params;
  const user = res.locals.user;
  try {
    const post = await Post.findOne({ _id: postId, author: user._id });
    if (!post) {
      return res.status(404).json({
        success: false,
        error: "Could not fount a post with that id associated with the user.",
      });
    }
    // This uses pre hooks to delete everything associated with this post i.e comments
    // Response of deleteOne { "acknowledged" : true, "deletedCount" : 1 }
    const postDelete = await Post.deleteOne({ _id: postId });
    if (!postDelete.deletedCount) {
      return res.status(500).send({ error: "Could not delete the post." });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
  // Inform to all followers through socket io
  try {
    const followersDocument = await Followers.find({ user: user._id });

    // All follers of user
    const followers = followersDocument[0].followers;

    // Infom for user logined
    socketHandler.deletePost(req, postId, user._id);

    // Delete post to all io.user who connected socket io
    followers.forEach((follower) => {
      socketHandler.deletePost(req, postId, follwer.user);
    });
  } catch (error) {
    next(error);
  }
};
module.exports.retrievePost = async (req, res, next) => {};
