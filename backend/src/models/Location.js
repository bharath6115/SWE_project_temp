const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema(
  {
    bus: { type: mongoose.Schema.Types.ObjectId, ref: "Bus", required: true, index: true },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["running", "delayed", "stopped"], required: true },
    point: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: { type: [Number], required: true },
    },
    etaMinutes: { type: Number, default: null },
  },
  { timestamps: true }
);

locationSchema.index({ point: "2dsphere" });
locationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 }); // 24 hours

module.exports = mongoose.model("Location", locationSchema);
