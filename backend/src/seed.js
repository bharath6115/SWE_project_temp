require("dotenv").config();
const connectDB = require("./config/db");
const User = require("./models/User");
const Route = require("./models/Route");
const Bus = require("./models/Bus");

const seed = async () => {
  await connectDB();

  await Promise.all([User.deleteMany({}), Route.deleteMany({}), Bus.deleteMany({})]);

  const route = await Route.create({
    name: "Main Campus Loop",
    code: "MCL-1",
    stops: [
      { name: "Library", latitude: 12.9716, longitude: 77.5946 },
      { name: "Engineering Block", latitude: 12.9736, longitude: 77.5986 },
      { name: "Hostel Gate", latitude: 12.9692, longitude: 77.5902 },
    ],
  });

  const bus = await Bus.create({
    number: "BUS-101",
    route: route._id,
    status: "stopped",
    currentLocation: { latitude: 12.9716, longitude: 77.5946, updatedAt: new Date() },
  });

  const admin = await User.create({
    name: "Admin User",
    email: "admin@campus.local",
    password: "admin123",
    role: "admin",
  });

  const driver = await User.create({
    name: "Driver User",
    email: "driver@campus.local",
    password: "driver123",
    role: "driver",
    assignedBus: bus._id,
  });

  bus.driver = driver._id;
  await bus.save();

  await User.create({
    name: "Student User",
    email: "student@campus.local",
    password: "student123",
    role: "student",
  });

  console.log("Seed complete");
  console.log("Admin login: admin@campus.local / admin123");
  console.log("Driver login: driver@campus.local / driver123");
  process.exit(0);
};

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
