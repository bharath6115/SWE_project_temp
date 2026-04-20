const mongoose = require("mongoose");

const busSchema = new mongoose.Schema(
  {
    number: { type: String, required: true, unique: true },
    route: { type: mongoose.Schema.Types.ObjectId, ref: "Route", required: true },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    status: {
      type: String,
      enum: ["running", "delayed", "stopped"],
      default: "stopped",
    },
    isTripActive: { type: Boolean, default: false },
    currentLocation: {
      latitude: { type: Number, default: 0 },
      longitude: { type: Number, default: 0 },
      updatedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Bus", busSchema);
