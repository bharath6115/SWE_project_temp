const express = require("express");
const auth = require("../middleware/auth");
const {
  createRoute,
  deleteRoute,
  getRoutes,
  updateRoute,
} = require("../controllers/routeController");

const router = express.Router();

router.get("/", auth(), getRoutes);
router.post("/", auth(["admin"]), createRoute);
router.patch("/:id", auth(["admin"]), updateRoute);
router.delete("/:id", auth(["admin"]), deleteRoute);

module.exports = router;
