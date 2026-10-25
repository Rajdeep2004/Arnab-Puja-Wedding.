require("dotenv").config();
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json({ limit: "100kb" }));
app.use(express.static(path.join(__dirname, "public")));

let memoryRsvps = [];
let RsvpModel = null;

if (process.env.MONGODB_URI) {
  const schema = new mongoose.Schema({
    name: { type: String, required: true, maxlength: 80 },
    attendance: { type: String, enum: ["yes", "no", "maybe"], required: true },
    guests: { type: Number, min: 1, max: 10, default: 1 },
    message: { type: String, maxlength: 500, default: "" },
    createdAt: { type: Date, default: Date.now }
  });
  RsvpModel = mongoose.model("Rsvp", schema);
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("MongoDB connection failed:", err.message));
}

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "arnab-puja-wedding" }));

app.get("/api/events", (_req, res) => {
  res.json({
    couple: { first: "Arnab", second: "Puja" },
    wedding: { date: "2026-11-21", time: "6:30 PM" },
    reception: { date: "2026-11-23", time: "6:30 PM" },
    venue: "Palashan (Sain Para), Purba Bardhaman, West Bengal 713424",
    mapsUrl: process.env.MAPS_URL || "https://www.google.com/maps/search/?api=1&query=Palashan%20Sain%20Para%20Purba%20Bardhaman%20713424",
    videoUrl: process.env.WEDDING_VIDEO_URL || ""
  });
});

app.post("/api/rsvp", async (req, res) => {
  const name = String(req.body.name || "").trim();
  const attendance = String(req.body.attendance || "");
  const guests = Number(req.body.guests || 1);
  const message = String(req.body.message || "").trim();

  if (!name || name.length > 80) return res.status(400).json({ error: "Please enter your name (up to 80 characters)." });
  if (!["yes", "no", "maybe"].includes(attendance)) return res.status(400).json({ error: "Please choose an attendance option." });
  if (!Number.isInteger(guests) || guests < 1 || guests > 10) return res.status(400).json({ error: "Guest count must be between 1 and 10." });
  if (message.length > 500) return res.status(400).json({ error: "Message must be 500 characters or fewer." });

  const item = { name, attendance, guests, message, createdAt: new Date() };
  try {
    if (RsvpModel && mongoose.connection.readyState === 1) {
      await RsvpModel.create(item);
    } else {
      memoryRsvps.push(item);
      if (memoryRsvps.length > 1000) memoryRsvps.shift();
    }
    res.status(201).json({ ok: true, message: "Thank you! Your response has been received." });
  } catch (err) {
    console.error("RSVP save error:", err.message);
    res.status(500).json({ error: "We couldn't save your response right now. Please try again." });
  }
});

app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

app.listen(PORT, () => console.log(`Arnab & Puja wedding site running on port ${PORT}`));
