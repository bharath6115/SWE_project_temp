require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const connectDB = require("./config/db");
const { attachSocketHandlers } = require("./services/socketService");
const socketAuth = require("./middleware/socketAuth");

const PORT = Number(process.env.PORT || 5000);

const start = async () => {
  await connectDB();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_ORIGIN?.split(",") || "*",
      methods: ["GET", "POST"],
    },
  });

  // Add socket authentication middleware
  io.use(socketAuth);

  attachSocketHandlers(io);

  server.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
};

start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
