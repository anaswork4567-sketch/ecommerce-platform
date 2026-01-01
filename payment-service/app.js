// payment-service/app.js
const express = require("express");
const cors = require("cors");
const promClient = require("prom-client");
const { startOrderConsumer } = require("./rabbitmq_consumer.js");

const app = express();
app.use(cors());
app.use(express.json());

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
  res.json({ status: "ok" });
});

// Prometheus metrics endpoint
app.get("/metrics", (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(register.metrics());
});

// Start RabbitMQ consumer and let it update `payments`
startOrderConsumer(payments);


module.exports = app;
