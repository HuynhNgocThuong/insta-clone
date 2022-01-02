const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
  date: {
    type: Date,
    default: Date.now,
  },
  author: {
    type: Schema.ObjectId,
    ref: "User",
  },
  message: String,
  post: {
    type: Schema.ObjectId,
    ref: "Post",
  },
});
CommentSchema.pre("deleteOne", async function (next) {
  const commentId = this.getQuery()["_id"];
  try {
    await mongoose.model("CommentVote").deleteOne({ comment: commentId });
    await mongoose
      .model("CommentReply")
      .deleteMany({ parentComment: commentId });
    next();
  } catch (error) {
    next(error);
  }
});
CommentSchema.pre("save", async function (next) {});
const commentModel = mongoose.model("Comment", CommentSchema);
module.export = commentModel;
