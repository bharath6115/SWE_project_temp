const jwt = require("jsonwebtoken");
const User = require("../models/User");

const socketAuth = (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("Unauthorized: No token provided"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    socket.userRole = decoded.role;
    next();
  } catch (error) {
    next(new Error(`Unauthorized: ${error.message}`));
  }
};

module.exports = socketAuth;
