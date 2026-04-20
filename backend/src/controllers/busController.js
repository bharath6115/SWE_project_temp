const Bus = require("../models/Bus");
const Route = require("../models/Route");
const User = require("../models/User");
const Location = require("../models/Location");
const { estimateEtaMinutes } = require("../utils/eta");

const getBuses = async (req, res, next) => {
  try {
    const buses = await Bus.find().populate("route driver", "name code email");
    res.json(buses);
  } catch (error) {
    next(error);
  }
};

const createBus = async (req, res, next) => {
  try {
    const route = await Route.findById(req.body.route);
    if (!route) return res.status(400).json({ message: "Invalid route" });
    const bus = await Bus.create(req.body);
    res.status(201).json(bus);
  } catch (error) {
    next(error);
  }
};

const updateBus = async (req, res, next) => {
  try {
    const bus = await Bus.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!bus) return res.status(404).json({ message: "Bus not found" });
    res.json(bus);
  } catch (error) {
    next(error);
  }
};

const deleteBus = async (req, res, next) => {
  try {
    const bus = await Bus.findByIdAndDelete(req.params.id);
    if (!bus) return res.status(404).json({ message: "Bus not found" });
    res.json({ message: "Bus deleted" });
  } catch (error) {
    next(error);
  }
};

const assignDriver = async (req, res, next) => {
  try {
    const { busId, driverId } = req.body;
    const [bus, driver] = await Promise.all([
      Bus.findById(busId),
      User.findOne({ _id: driverId, role: "driver" }),
    ]);
    if (!bus || !driver) return res.status(400).json({ message: "Invalid bus or driver" });

    bus.driver = driver._id;
    await bus.save();
    driver.assignedBus = bus._id;
    await driver.save();

    res.json({ message: "Driver assigned", busId, driverId });
  } catch (error) {
    next(error);
  }
};

const getBusLocations = async (req, res, next) => {
  try {
    const latest = await Location.aggregate([
      { $sort: { createdAt: -1 } },
      { $group: { _id: "$bus", doc: { $first: "$$ROOT" } } },
    ]);
    res.json(latest.map((entry) => entry.doc));
  } catch (error) {
    next(error);
  }
};

const getBusEta = async (req, res, next) => {
  try {
    const { busId, lat, lng } = req.query;
    const bus = await Bus.findById(busId);
    if (!bus) return res.status(404).json({ message: "Bus not found" });

    const eta = estimateEtaMinutes(
      bus.currentLocation,
      { latitude: Number(lat), longitude: Number(lng) },
      Number(process.env.DEFAULT_SPEED_KMPH || 24)
    );
    res.json({ busId, etaMinutes: eta });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBuses,
  createBus,
  updateBus,
  deleteBus,
  assignDriver,
  getBusLocations,
  getBusEta,
};
