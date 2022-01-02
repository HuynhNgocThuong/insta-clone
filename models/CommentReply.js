const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CommentReplySchema = new Schema({
  parentComment: {
    type: Schema.ObjectId,
    ref: "Comment",
  },
  date: {
    type: Date,
    default: Date.now,
  },
  message: String,
  author: {
    type: Schema.ObjectId,
    ref: "User",
  },
});

CommentReplySchema.pre("deleteMany", async function (next) {});
CommentReplySchema.pre("deleteOne", async function (next) {});
CommentReplySchema.pre("save", async function (next) {});

const commentReplyModel = mongoose.model("CommentReply", CommentReplySchema);

module.exports = commentReplyModel;
