const mongoose = require("mongoose");
const PostVote = require("./PostVote");
const Comment = require("./Comment");
const Schema = mongoose.Schema;

const PostSchema = new Schema({
  image: String,
  filter: String,
  thumbnail: String,
  caption: String,
  hashtags: [],
  date: {
    type: Date,
    defautl: Date.now,
  },
  author: {
    type: Schema.ObjectId,
    ref: "User",
  },
});

PostSchema.pre("deleteOne", async function (next) {
  const postId = this.getQuery()["_id"];
  try {
    await PostVote.deleteOne({ post: postId });
    await Comment.deleteMany({ post: postId });
    next();
  } catch (error) {
    next(error);
  }
});

const postModel = mongoose.model("Post", PostSchema);
module.exports = postModel;
