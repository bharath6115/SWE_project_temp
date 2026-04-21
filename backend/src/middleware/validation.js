const validateLocationUpdate = (req, res, next) => {
  try {
    const { busId, latitude, longitude, status } = req.body;

    // Check required fields
    if (!busId) {
      return res.status(400).json({ message: "Bus ID is required" });
    }

    if (latitude == null || longitude == null) {
      return res
        .status(400)
        .json({ message: "Latitude and longitude are required" });
    }

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    // Validate coordinates format
    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return res.status(400).json({ message: "Coordinates must be numbers" });
    }

    // Validate coordinate ranges
    if (latitude < -90 || latitude > 90) {
      return res
        .status(400)
        .json({ message: "Latitude must be between -90 and 90" });
    }

    if (longitude < -180 || longitude > 180) {
      return res
        .status(400)
        .json({ message: "Longitude must be between -180 and 180" });
    }

    // Validate status
    const validStatuses = ["running", "delayed", "stopped"];
    if (!validStatuses.includes(status)) {
      return res
        .status(400)
        .json({
          message: `Status must be one of: ${validStatuses.join(", ")}`,
        });
    }

    // Validate busId format (MongoDB ObjectId)
    if (!busId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid bus ID format" });
    }

    next();
  } catch (error) {
    return res.status(400).json({ message: "Invalid request format" });
  }
};

const validateRouteCreate = (req, res, next) => {
  try {
    const { name, stops } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Route name is required" });
    }

    if (!Array.isArray(stops) || stops.length === 0) {
      return res
        .status(400)
        .json({ message: "Route must have at least one stop" });
    }

    // Validate each stop
    for (let i = 0; i < stops.length; i++) {
      const stop = stops[i];
      if (!stop.name || !stop.latitude || !stop.longitude) {
        return res.status(400).json({
          message: `Stop ${i + 1} must have name, latitude, and longitude`,
        });
      }

      if (
        typeof stop.latitude !== "number" ||
        typeof stop.longitude !== "number"
      ) {
        return res.status(400).json({
          message: `Stop ${i + 1} coordinates must be numbers`,
        });
      }

      if (
        stop.latitude < -90 ||
        stop.latitude > 90 ||
        stop.longitude < -180 ||
        stop.longitude > 180
      ) {
        return res.status(400).json({
          message: `Stop ${i + 1} has invalid coordinates`,
        });
      }
    }

    next();
  } catch (error) {
    return res.status(400).json({ message: "Invalid route data format" });
  }
};

const validateBusCreate = (req, res, next) => {
  try {
    const { number, route } = req.body;

    if (!number || !number.toString().trim()) {
      return res.status(400).json({ message: "Bus number is required" });
    }

    if (!route) {
      return res.status(400).json({ message: "Route ID is required" });
    }

    if (!route.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid route ID format" });
    }

    next();
  } catch (error) {
    return res.status(400).json({ message: "Invalid bus data format" });
  }
};

module.exports = {
  validateLocationUpdate,
  validateRouteCreate,
  validateBusCreate,
};
