const express = require("express");
const auth = require("../middleware/auth");
const { getDrivers, getUsers } = require("../controllers/userController");

const router = express.Router();

router.get("/", auth(["admin"]), getUsers);
router.get("/drivers", auth(["admin"]), getDrivers);

module.exports = router;
