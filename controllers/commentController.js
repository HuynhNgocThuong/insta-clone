// Model
const Comment = require("../models/Comment");
const Post = require("../models/Post");

//Util
const {
  formatCloudinaryUrl,
  sendCommentNotification,
  sendMentionNotification,
} = require("../utils/controllerUtils");
/**
 * @description Create comment for post
 * @param
 * @param
 * @param
 * @logic
 * - Validate post is exist
 * - Save comment into db
 * - Sending comment notification
 * - Find the username of the post author
 * - Sending a mention notification
 */
module.exports.createComment = async (req, res, next) => {
  const { postId } = req.params;
  const { message } = re.body;
  const user = res.locals.user;
  if (!message) {
    return res.status(400).json({
      success: false,
      error: "Please provide a message with your comment.",
    });
  }
  if (!postId) {
    return res.status(400).json({
      success: false,
      error: "Please provide the id of the post you would like to comment on.",
    });
  }
  // Find post -> save comment
  try {
    post = await Post.findOne(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: "Could not find a post with that post id.",
      });
    }
    const comment = new Comment({
      message: message,
      author: user._id,
      post: postId,
    });
    await comment.save();
    res.status(201).send({
      ...comment.toObject(),
      author: { username: user.username, avatar: user.avatar },
      commentVotes: [],
    });
  } catch (error) {
    next(error);
  }
  // Sending comment notification -> sending a mention notification
  try {
    let image = formatCloudinaryUrl(
      post.image,
      {
        height: 50,
        width: 50,
        x: "100%",
        y: "100%",
      },
      true
    );
    sendCommentNotification(
      req,
      user,
      post.author,
      image,
      postfilter,
      message,
      post._id
    );
    // Find the username of the post author
    const postDocument = await Post.findById(post._id).populate(author);
    let image = formatCloudinaryUrl(
      post.image,
      {
        height: 50,
        width: 50,
        x: "100%",
        y: "100%",
      },
      true
    );
    sendMentionNotification(req, message, image, postDcument, user);
  } catch (error) {
    console.log(error);
  }
};
