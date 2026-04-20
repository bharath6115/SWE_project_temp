const Bus = require("../models/Bus");
const Location = require("../models/Location");
const User = require("../models/User");
const { estimateEtaMinutes } = require("../utils/eta");

const locationThrottleMs = Number(process.env.LOCATION_THROTTLE_MS || 2000);
const lastUpdateByDriver = new Map();

const attachSocketHandlers = (io) => {
  io.on("connection", (socket) => {
    socket.on("locationUpdate", async (payload) => {
      try {
        const { driverId, busId, latitude, longitude, status } = payload || {};
        if (!driverId || !busId || latitude == null || longitude == null || !status) return;

        const now = Date.now();
        const last = lastUpdateByDriver.get(driverId) || 0;
        if (now - last < locationThrottleMs) return;
        lastUpdateByDriver.set(driverId, now);

        const [driver, bus] = await Promise.all([User.findById(driverId), Bus.findById(busId).populate("route")]);
        if (!driver || driver.role !== "driver" || !bus) return;

        const firstStop = bus.route?.stops?.[0];
        const etaMinutes = estimateEtaMinutes(
          { latitude, longitude },
          firstStop || { latitude, longitude },
          Number(process.env.DEFAULT_SPEED_KMPH || 24)
        );

        const location = await Location.create({
          bus: bus._id,
          driver: driver._id,
          status,
          point: { type: "Point", coordinates: [Number(longitude), Number(latitude)] },
          etaMinutes,
        });

        bus.status = status;
        bus.currentLocation = { latitude: Number(latitude), longitude: Number(longitude), updatedAt: new Date() };
        await bus.save();

        const locationPayload = {
          _id: location._id,
          bus: bus._id,
          busId: bus._id,
          driver: driver._id,
          status,
          latitude: Number(latitude),
          longitude: Number(longitude),
          etaMinutes,
          updatedAt: location.createdAt,
        };

        io.emit("busLocationUpdated", locationPayload);
        io.emit("locationUpdate", locationPayload);

        if (status === "delayed") {
          io.emit("delayNotification", {
            busId: bus._id,
            busNumber: bus.number,
            message: `Bus ${bus.number} is delayed.`,
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error("Socket location update error:", error.message);
      }
    });
  });
};

module.exports = { attachSocketHandlers };
