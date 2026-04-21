const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth =
  (allowedRoles = []) =>
  async (req, res, next) => {
    try {
      const token = req.cookies?.campus_bus_token || req.headers.authorization?.split(" ")[1];
      if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (!user) return res.status(401).json({ message: "Invalid token" });

      if (allowedRoles.length && !allowedRoles.includes(user.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  };

module.exports = auth;
