require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const app = express();
const mongoose = require("mongoose");
const socketio = require("socket.io");

const PORT = process.env.PORT || 9000;
// Connect to mongodb

// Routes
const apiRouter = require("./routes");
app.use(helmet());
app.use(helmet.hidePoweredBy());
app.use(cors());
app.use(bodyParser.json());
app.set("trust proxy", 1);
app.use("/api", apiRouter);

(async function () {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to database.");
  } catch (error) {
    throw new Error(error);
  }
})();
app.use((error, req, res, next) => {
  console.log(error.message);
  if (!error.statusCode) {
    error.statusCode = 500;
  }
  if (error.name == "MulterError") {
    if (error.message === "File too large") {
      return res
        .status(400)
        .json({ error: "Your file exceeds the limit of 10MB." });
    }
  }
  return res.status(error.statusCode || 500).json({
    error:
      error.statusCode >= 500
        ? "An unexpected error ocurred, please try again later."
        : error.message,
  });
});
const expressServer = app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});

// Refer: https://socket.io/get-started/chat
// Create new instance socketio with argument the app object
const io = socketio(expressServer);
app.set("socketio", io);
console.log("Socket.io listening for connections");

// Authenticate before establishing a socket connection
io.use((socket, next) => {
  const token = socket.handshake.query.token;
  if (token) {
    try {
      const user = jwt.decode(token, process.env.JWT_SECRET);
      if (!user) {
        return next(new Error("Not Authorizated."));
      }
      socket.user = user;
      return next();
    } catch (error) {
      next(error);
    }
  }
}).on("connection", (socket) => {
  socket.join(socket.user.id);
  console.log("Socket connected: ", socket.id);
});
