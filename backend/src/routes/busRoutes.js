const express = require("express");
const auth = require("../middleware/auth");
const { validateBusCreate } = require("../middleware/validation");
const {
  assignDriver,
  createBus,
  deleteBus,
  getBuses,
  getRecentDelays,
  getBusEta,
  getBusLocations,
  updateBus,
} = require("../controllers/busController");

const router = express.Router();

router.get("/", getBuses);
router.get("/locations/latest", getBusLocations);
router.get("/delays/recent", getRecentDelays);
router.get("/eta", getBusEta);
router.post("/", auth(["admin"]), validateBusCreate, createBus);
router.patch("/:id", auth(["admin", "driver"]), updateBus);
router.delete("/:id", auth(["admin"]), deleteBus);
router.post("/assign-driver", auth(["admin"]), assignDriver);

module.exports = router;
