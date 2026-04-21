const Bus = require("../models/Bus");
const Location = require("../models/Location");
const User = require("../models/User");
const { estimateEtaMinutes } = require("../utils/eta");

const locationThrottleMs = Number(process.env.LOCATION_THROTTLE_MS || 2000);
const lastUpdateByDriver = new Map();

// Cleanup old throttle entries every 5 minutes
const throttleCleanupInterval = 5 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of lastUpdateByDriver.entries()) {
    if (now - timestamp > throttleCleanupInterval) {
      lastUpdateByDriver.delete(key);
    }
  }
}, throttleCleanupInterval);

const validateLocationPayload = (payload) => {
  const { busId, latitude, longitude, status } = payload || {};

  if (!busId) return { valid: false, error: "Bus ID is required" };
  if (latitude == null || longitude == null) return { valid: false, error: "Latitude and longitude are required" };
  if (!status) return { valid: false, error: "Status is required" };

  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return { valid: false, error: "Coordinates must be numbers" };
  }

  if (latitude < -90 || latitude > 90) {
    return { valid: false, error: "Latitude must be between -90 and 90" };
  }

  if (longitude < -180 || longitude > 180) {
    return { valid: false, error: "Longitude must be between -180 and 180" };
  }

  const validStatuses = ["running", "delayed", "stopped"];
  if (!validStatuses.includes(status)) {
    return { valid: false, error: `Status must be one of: ${validStatuses.join(", ")}` };
  }

  if (!busId.match(/^[0-9a-fA-F]{24}$/)) {
    return { valid: false, error: "Invalid bus ID format" };
  }

  return { valid: true };
};

const attachSocketHandlers = (io) => {
  io.on("connection", (socket) => {
    // Log successful connection
    console.log(
      `[Socket] User connected: ${socket.id}, userId: ${socket.userId}, role: ${socket.userRole}`,
    );

    // Handle client subscribing to bus room
    socket.on("subscribeToBus", (busId) => {
      try {
        if (!busId) {
          socket.emit("error", { message: "Invalid bus ID" });
          return;
        }

        const room = `bus_${busId}`;
        socket.join(room);
        console.log(`[Socket] ${socket.id} subscribed to room: ${room}`);
      } catch (error) {
        console.error("[Socket] Subscribe error:", error.message);
        socket.emit("error", { message: "Failed to subscribe to bus" });
      }
    });

    // Handle client unsubscribing from bus room
    socket.on("unsubscribeFromBus", (busId) => {
      try {
        if (!busId) return;
        const room = `bus_${busId}`;
        socket.leave(room);
        console.log(`[Socket] ${socket.id} unsubscribed from room: ${room}`);
      } catch (error) {
        console.error("[Socket] Unsubscribe error:", error.message);
      }
    });

    // Handle location updates from driver
    socket.on("locationUpdate", async (payload) => {
      try {
        // Validate payload
        const validation = validateLocationPayload(payload);
        if (!validation.valid) {
          socket.emit("error", { message: validation.error });
          return;
        }

        const { busId, latitude, longitude, status } = payload;

        // Only drivers can send location updates
        if (socket.userRole !== "driver") {
          socket.emit("error", {
            message: "Only drivers can send location updates",
          });
          return;
        }

        // Throttle updates per driver
        const driverId = String(socket.userId);
        const throttleKey = `${driverId}:${busId}`;
        const now = Date.now();
        const last = lastUpdateByDriver.get(throttleKey) || 0;
        if (now - last < locationThrottleMs) {
          socket.emit("error", {
            message: `Too many updates. Wait ${Math.ceil((locationThrottleMs - (now - last)) / 1000)}s`,
          });
          return;
        }
        lastUpdateByDriver.set(throttleKey, now);

        // Fetch and validate driver & bus
        const [driver, bus] = await Promise.all([
          User.findById(driverId),
          Bus.findById(busId).populate("route"),
        ]);

        if (!driver || driver.role !== "driver") {
          socket.emit("error", { message: "Driver not found or invalid" });
          return;
        }

        if (!bus) {
          socket.emit("error", { message: "Bus not found" });
          return;
        }

        // Verify driver is assigned to bus
        if (String(bus.driver) !== String(driverId)) {
          socket.emit("error", { message: "You are not assigned to this bus" });
          return;
        }

        // Calculate ETA to first stop
        const firstStop = bus.route?.stops?.[0];
        const reportedSpeedKmph = Number(payload.speedKmph);
        const speedForEta =
          Number.isFinite(reportedSpeedKmph) && reportedSpeedKmph > 0
            ? reportedSpeedKmph
            : Number(process.env.DEFAULT_SPEED_KMPH || 24);
        const etaMinutes = estimateEtaMinutes(
          { latitude, longitude },
          firstStop || { latitude, longitude },
          speedForEta,
        );

        // Save location record
        const location = await Location.create({
          bus: bus._id,
          driver: driver._id,
          status,
          point: {
            type: "Point",
            coordinates: [Number(longitude), Number(latitude)],
          },
          etaMinutes,
        });

        // Update bus current location & status
        const previousStatus = bus.status;
        bus.status = status;
        bus.currentLocation = {
          latitude: Number(latitude),
          longitude: Number(longitude),
          updatedAt: new Date(),
        };
        await bus.save();

        // Prepare location payload
        const locationPayload = {
          _id: location._id,
          busId: bus._id,
          driverId: driver._id,
          status,
          latitude: Number(latitude),
          longitude: Number(longitude),
          etaMinutes,
          updatedAt: location.createdAt,
        };

        // Emit to specific bus room (subscribers only)
        const busRoom = `bus_${busId}`;
        io.to(busRoom).emit("busLocationUpdated", locationPayload);

        // Emit delay notification to all connected clients only if status changed TO delayed
        if (status === "delayed" && previousStatus !== "delayed") {
          io.emit("delayNotification", {
            busId: bus._id,
            busNumber: bus.number,
            message: `Bus ${bus.number} is delayed.`,
            updatedAt: new Date().toISOString(),
          });
        }

        console.log(
          `[Socket] Location update from driver ${driverId} for bus ${busId}: ${status}`,
        );
      } catch (error) {
        console.error("[Socket] Location update error:", error.message);
        socket.emit("error", { message: "Failed to update location" });
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`[Socket] User disconnected: ${socket.id}`);
    });

    // Handle socket errors
    socket.on("error", (error) => {
      console.error(`[Socket] Error from ${socket.id}:`, error.message);
    });
  });
};

module.exports = { attachSocketHandlers };
