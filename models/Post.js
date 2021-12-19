const mongoose = require("mongoose");
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

PostSchem.pre("deleteOne", async function (next) {
  const postId = this.getQuery()["_id"];
  try {
    // await mongoose.model("PostVote").deleteOne({ post: postId });
    // await mongoose.model("Comment").deleteMany({ post: postId });
    next();
  } catch (error) {
    next(error);
  }
});

const postModel = mongoose("Post", PostSchema);
module.exports = postModel;
