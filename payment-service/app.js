// payment-service/app.js
const express = require("express");
const cors = require("cors");
const promClient = require("prom-client");
const { startOrderConsumer, getRabbitMQStatus } = require("./rabbitmq_consumer.js");

const app = express();
app.use(cors());
app.use(express.json());

// Health check state
let rabbitmqConnected = false;
let rabbitmqConnectedTime = null;

// Prometheus metrics
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

const httpRequestDuration = new promClient.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

const paymentsCounter = new promClient.Counter({
  name: "payments_total",
  help: "Total number of payments",
  labelNames: ["status"],
  registers: [register],
});

const paymentsGauge = new promClient.Gauge({
  name: "payments_amount_total",
  help: "Total amount of payments",
  registers: [register],
});

// Middleware to track HTTP requests
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration.labels(req.method, req.route?.path || req.path, res.statusCode).observe(duration);
  });
  next();
});

let payments = [];

// Update metrics when payments change
function updateMetrics() {
  const total = payments.reduce((sum, p) => sum + p.amount, 0);
  paymentsGauge.set(total);
  const completed = payments.filter(p => p.status === "completed").length;
  const pending = payments.filter(p => p.status === "pending").length;
  paymentsCounter.labels("completed").inc(completed);
  paymentsCounter.labels("pending").inc(pending);
}

app.get("/payments", (req, res) => {
  res.json(payments);
});

app.post("/payments", (req, res) => {
  try {
    const { order_id, amount, status, method } = req.body;
    
    if (!order_id || !amount || !status || !method) {
      return res.status(400).json({ error: "Missing required fields: order_id, amount, status, method" });
    }

    const newPayment = {
      id: payments.length ? payments[payments.length - 1].id + 1 : 1,
      order_id,
      amount: Number(amount),
      status,
      method,
    };

    payments.push(newPayment);
    updateMetrics();

    res.status(201).json(newPayment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/health", (req, res) => {
  const rabbitmqStatus = getRabbitMQStatus();
  const health = {
    status: rabbitmqStatus.connected ? "healthy" : "unhealthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    rabbitmq: {
      connected: rabbitmqStatus.connected,
      attempts: rabbitmqStatus.attempts,
      lastError: rabbitmqStatus.lastError,
    },
    payments: {
      total: payments.length,
      completed: payments.filter(p => p.status === "completed").length,
    },
  };

  // Liveness check - return 200 if process is alive
  const statusCode = 200;
  res.status(statusCode).json(health);
});

// Readiness check - return 200 only if ready to accept traffic
app.get("/ready", (req, res) => {
  const rabbitmqStatus = getRabbitMQStatus();
  if (rabbitmqStatus.connected) {
    res.status(200).json({ ready: true, rabbitmq: true });
  } else {
    res.status(503).json({ ready: false, rabbitmq: false, message: "RabbitMQ not connected yet" });
  }
});

// Prometheus metrics endpoint
app.get("/metrics", (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(register.metrics());
});

// Start RabbitMQ consumer and let it update `payments`
startOrderConsumer(payments);

// Graceful shutdown handling - will be called when server starts
function setupGracefulShutdown(server) {
  let isShuttingDown = false;

  function gracefulShutdown(signal) {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log(`\n[Shutdown] Received ${signal} signal. Starting graceful shutdown...`);
    
    // Stop accepting new connections
    server.close(() => {
      console.log("[Shutdown] ✅ HTTP server closed");
      process.exit(0);
    });

    // Force exit after 45 seconds if graceful shutdown doesn't complete
    setTimeout(() => {
      console.error("[Shutdown] ❌ Graceful shutdown timeout. Force exiting...");
      process.exit(1);
    }, 45000);
  }

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
}

// Export for use in server.js
app.setupGracefulShutdown = setupGracefulShutdown;
module.exports = app;
