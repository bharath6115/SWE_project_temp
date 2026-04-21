const express = require("express");
const auth = require("../middleware/auth");
const { validateRouteCreate } = require("../middleware/validation");
const {
  createRoute,
  deleteRoute,
  getRoutes,
  updateRoute,
} = require("../controllers/routeController");

const router = express.Router();

router.get("/", auth(), getRoutes);
router.post("/", auth(["admin"]), validateRouteCreate, createRoute);
router.patch("/:id", auth(["admin"]), validateRouteCreate, updateRoute);
router.delete("/:id", auth(["admin"]), deleteRoute);

module.exports = router;
