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
const { requiredAuth, optionalAuth } = require("../controllers/authController");
// Get suggested for the username
// userRouter.get("/suggested/:max?", requiredAuth, retrieveSuggestedUsers);
// Get information username
userRouter.get("/:username", requiredAuth, retrieveUser);
// Get all post of username
// userRouter.get("/:username/post/:offset", retrievePosts);

// userRouter.get("/:userId/:offset/following", requiredAuth, retrieveFollowing);
// userRouter.get("/:userId/:offset/followers", requiredAuth, retrieveFollowers);
userRouter.get("/:username/:offset/search", searchUsers);

// userRouter.put("/confirm", requiredAuth, confirmUser);
userRouter.put(
  "/avatar",
  requiredAuth,
  multer({
    dest: "temp/",
    limits: { fieldSize: 8 * 1024 * 1024, fileSize: 1000000 },
  }).single("image"),
  changeAvatar
);
userRouter.put("/", requiredAuth, updateProfile);

userRouter.delete("/avatar", requiredAuth, removeAvatar);

// userRouter.post("/:postId/bookmark", requiredAuth, bookmarkPost);
userRouter.post("/:userId/follow", requiredAuth, followUser);

module.exports = userRouter;
