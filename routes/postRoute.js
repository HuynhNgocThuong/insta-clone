const express = require("express");
const postRouter = express.Router();
const multer = require("multer");
const upload = multer({
  dest: "temp/",
  limits: { fileSize: 10 * 1024 * 1024 },
}).single("image");

//Refer:  https://dev.to/brunohgv/limiting-node-js-api-calls-with-express-rate-limit-11kl
const rateLimit = require("express-rate-limit");
const postLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
});
const { requiredAuth } = require("../controllers/authController");
const {
  createPost,
  deletePost,
  retrivePost,
} = require("../controllers/postController");

postRouter.post("/", postLimiter, requiredAuth, upload, createPost);
postRouter.delete("/:postId", requiredAuth, deletePost);
postRouter.get("/:postId", requiredAuth, retrievePost);
module.exports = postRouter;
