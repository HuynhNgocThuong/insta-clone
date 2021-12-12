const express = require("express");
const userRouter = express.Router;

const {
  retrieveUser,
  retrievePosts,
  bookmarkPost,
  followUser,
  retrieveFollowers,
  retrieveFollowing,
  searchUsers,
  confirmUser,
  changeAvatar,
  removeAvatar,
  updateProfile,
  retrieveSuggestedUsers,
} = require("../controllers/userController");
const { requireAuth, optionalAuth } = require("../controllers/authController");
userRouter.get("/suggested/:max?", requireAuth, retrieveSuggestedUsers);
userRouter.get("/:username", requireAuth, retrieveUser);
