const User = require("../models/User");

const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    next(error);
  }
};

const getDrivers = async (req, res, next) => {
  try {
    const drivers = await User.find({ role: "driver" }).populate("assignedBus", "number status");
    res.json(drivers);
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsers, getDrivers };
