const authRouter = require("./authRoute");
const express = require("express");
const apiRouter = express.Router();
// const commentRouter = require("./comment");
// const notificationRouter = require("./notification");
// const postRouter = require("./post");
// const userRouter = require("./user");

apiRouter.use("/auth", authRouter);
// apiRouter.use("/user", userRouter);
// apiRouter.use("/post", postRouter);
// apiRouter.use("/comment", commentRouter);
// apiRouter.use("/notification", notificationRouter);

module.exports = apiRouter;
