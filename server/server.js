#!/usr/bin/env node

require('dotenv').config();
var express = require("express"), // see expressjs.com
    socket_io = require("socket.io"), // see socket.io
    mongoose = require("mongoose");
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = socket_io(server);

// Mongoose Schema
const LogSchema = new mongoose.Schema({
  type: String,
  message: String,
  timestamp: { type: Date, default: Date.now }
});
const Log = mongoose.model('Log', LogSchema);

// List of connected clients
var clients = [];

app.configure(function() {
  // We want bodyParser so we can push JSON from PHP
  app.use(express.bodyParser());
  // and logger so we can see requests etc
  app.use(express.logger());
});

app.post("/my-secret-api", function(req, res) {
  // Need something to send!
  if (!req.body || req.body.type) {
    res.send(406);
  }

  // Let the remote end get on with whatever it was doing
  res.send(200);

  // Push the content of the request to the clients
  clients.forEach(function(client) {
    client.emit(req.body.type, req.body.data);
  });
});

// Endpoint to create a log
app.post("/log", function(req, res) {
  if (!req.body || !req.body.type || !req.body.message) {
    return res.status(400).send("Invalid log data");
  }

  const newLog = new Log({
    type: req.body.type,
    message: req.body.message
  });

  newLog.save()
    .then(item => res.status(201).send(item))
    .catch(err => res.status(500).send("Unable to save to database"));
});

// Endpoint to get all logs
app.get("/logs", async (req, res) => {
  try {
    const logs = await Log.find();
    res.json(logs);
  } catch (err) {
    res.status(500).send("Error fetching logs from database");
  }
});

io.sockets.on("connection", function(socket) {
  // Push the client onto the list when it connects
  clients.push(socket);

  // Make sure we remove the client from the list when it disconnects
  socket.on("disconnect", function() {
    for (var i=0;i<clients.length;++i) {
      if (clients[i] == socket) {
        clients.splice(i, 1);
        break;
      }
    }
  });
});

// Connect to MongoDB
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost/teampulse_db';
mongoose.connect(mongoUri);

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  // we're connected!
  console.log("MongoDB connection successful");

  server.listen(3000, function() {
    console.log("Server listening on port 3000");
  });
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});