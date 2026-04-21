const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../app");
const User = require("../models/User");
const Route = require("../models/Route");
const Bus = require("../models/Bus");

let mongoServer;

const signToken = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "1h" });

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

describe("Bus update authorization", () => {
  beforeAll(async () => {
    process.env.JWT_SECRET = "test-secret";
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), { dbName: "campus_bus_tracking_test" });
  });

  afterEach(async () => {
    await Promise.all([User.deleteMany({}), Route.deleteMany({}), Bus.deleteMany({})]);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  const seedBusWithUsers = async () => {
    const route = await Route.create({
      name: "Test Route",
      code: `TR-${Date.now()}`,
      stops: [{ name: "Stop A", latitude: 12.9, longitude: 77.5 }],
    });

    const admin = await User.create({
      name: "Admin",
      email: `admin-${Date.now()}@test.local`,
      password: "admin123",
      role: "admin",
    });

    const assignedDriver = await User.create({
      name: "Assigned Driver",
      email: `driver-assigned-${Date.now()}@test.local`,
      password: "driver123",
      role: "driver",
    });

    const otherDriver = await User.create({
      name: "Other Driver",
      email: `driver-other-${Date.now()}@test.local`,
      password: "driver123",
      role: "driver",
    });

    const bus = await Bus.create({
      number: `BUS-${Date.now()}`,
      route: route._id,
      driver: assignedDriver._id,
      status: "stopped",
    });

    assignedDriver.assignedBus = bus._id;
    await assignedDriver.save();

    return { admin, assignedDriver, otherDriver, bus };
  };

  test("admin can update full bus fields", async () => {
    const { admin, bus } = await seedBusWithUsers();
    const token = signToken(admin._id);

    const response = await request(app)
      .patch(`/api/buses/${bus._id}`)
      .set(authHeader(token))
      .send({ number: "BUS-ADMIN-UPDATED", status: "running", isTripActive: true });

    expect(response.status).toBe(200);
    expect(response.body.number).toBe("BUS-ADMIN-UPDATED");
    expect(response.body.status).toBe("running");
    expect(response.body.isTripActive).toBe(true);
  });

  test("assigned driver can update status and trip state", async () => {
    const { assignedDriver, bus } = await seedBusWithUsers();
    const token = signToken(assignedDriver._id);

    const response = await request(app)
      .patch(`/api/buses/${bus._id}`)
      .set(authHeader(token))
      .send({ status: "delayed", isTripActive: true });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("delayed");
    expect(response.body.isTripActive).toBe(true);
  });

  test("assigned driver cannot update restricted fields", async () => {
    const { assignedDriver, bus } = await seedBusWithUsers();
    const token = signToken(assignedDriver._id);

    const response = await request(app)
      .patch(`/api/buses/${bus._id}`)
      .set(authHeader(token))
      .send({ number: "BUS-DRIVER-HACK" });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/Drivers can only update status and trip state/i);
  });

  test("unassigned driver is forbidden from updating another bus", async () => {
    const { otherDriver, bus } = await seedBusWithUsers();
    const token = signToken(otherDriver._id);

    const response = await request(app)
      .patch(`/api/buses/${bus._id}`)
      .set(authHeader(token))
      .send({ status: "running" });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Forbidden");
  });
});
