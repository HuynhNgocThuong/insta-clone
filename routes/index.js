const express = require("express");
const apiRouter = express.Router();

// const notificationRouter = require("./notification");
const postRouter = require("./postRoute");
const authRouter = require("./authRoute");
const userRouter = require("./userRoute");
const commentRouter = require("./commentRoute");

apiRouter.use("/auth", authRouter);
apiRouter.use("/user", userRouter);
apiRouter.use("/post", postRouter);
apiRouter.use("/comment", commentRouter);
// apiRouter.use("/notification", notificationRouter);

module.exports = apiRouter;
