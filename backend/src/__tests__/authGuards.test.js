const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../app");
const User = require("../models/User");

let mongoServer;

const signToken = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "1h" });

describe("Auth and role guards", () => {
  beforeAll(async () => {
    process.env.JWT_SECRET = "test-secret";
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), { dbName: "campus_bus_tracking_test" });
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  test("GET /api/users returns 401 when token is missing", async () => {
    const response = await request(app).get("/api/users");
    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Unauthorized");
  });

  test("GET /api/users returns 403 when authenticated user is not admin", async () => {
    const driver = await User.create({
      name: "Driver User",
      email: `driver-${Date.now()}@test.local`,
      password: "driver123",
      role: "driver",
    });
    const token = signToken(driver._id);

    const response = await request(app).get("/api/users").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Forbidden");
  });
});
