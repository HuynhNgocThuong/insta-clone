// Middleware
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const ObjectId = require("mongoose").Types.ObjectId;
const filters = require("../utils/filters");
const axios = require("axios");
// Model
const Post = require("../models/Post");
const PostVote = require("../models/PostVote");
const {
  formatCloudinaryUrl,
  retrieveComments,
  populatePostsPipeline,
} = require("../utils/controllerUtils");

module.exports.createPost = async (req, res, next) => {
  const user = res.locals.user;
  const { caption, filter: filterName } = req.body;
  let post = undefined;
  const filterObject = filter.find((filter) => filter.name === filterName);
  const hashtag = [];

  // Refer: https://github.com/Hypercontext/linkifyjs
  // Refer: https://linkify.js.org/docs/
  // Get all hashtag from caption
  linkify.find(caption).forEach((result) => {
    if (result.type === "hashtag") {
      hashtag.push(result.value.substring(1));
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
        ...post.toOject(),
        postVotes: [],
        comments: [],
        author: { avatar: user.avatar, username: user.username },
      },
    });
  } catch (error) {
    next(error);
  }
};
