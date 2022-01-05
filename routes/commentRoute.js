const express = require("express");
const commentRouter = express.Router();
const { requiredAuth } = require("../controllers/authController");
const { createComment } = require("../controllers/commentController");

commentRouter.post("/:postId", requiredAuth, createComment);
module.exports = commentRouter;
