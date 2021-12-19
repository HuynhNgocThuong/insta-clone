const express = require("express");
const multer = require("multer");
const userRouter = express.Router();

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
// Get suggested for the username
userRouter.get("/suggested/:max?", requireAuth, retrieveSuggestedUsers);
// Get information username
userRouter.get("/:username", requireAuth, retrieveUser);
// Get all post of username
userRouter.get("/:username/post/:offset", retrievePosts);

userRouter.get("/:userId/:offset/following", requireAuth, retrieveFollowing);
userRouter.get("/:userId/:offset/followers", requireAuth, retrieveFollowers);
userRouter.get("/:userId/:offset/search");

userRouter.put("/confirm", requireAuth, confirmUser);
userRouter.put(
  "/avatar",
  requireAuth,
  multer({
    dest: "/temp",
    limits: { fieldSize: 8 * 1024 * 1024, fileSize: 1000000 },
  }).single("image"),
  changeAvatar
);
userRouter.put("/", requireAuth, updateProfile);

userRouter.delete("/avatar", requireAuth, removeAvatar);

userRouter.post("/:postId/bookmark", requireAuth, bookmarkPost);
userRouter.post("/:userId/follow", requireAuth, followUser);

module.exports = userRouter;
