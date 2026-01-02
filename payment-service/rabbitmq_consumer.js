// payment-service/rabbitmq_consumer.js
require("dotenv").config();
const amqplib = require("amqplib");
const axios = require("axios");
const CircuitBreaker = require("opossum");

const RABBIT_URL =
  process.env.RABBIT_URL || "amqp://guest:guest@rabbitmq:5672";

// Call order service via Kong by default. Can override with ORDER_SERVICE_BASE env.
const ORDER_SERVICE_BASE =
  process.env.ORDER_SERVICE_BASE || "http://order-service:3003";

// Circuit breaker options
const circuitBreakerOptions = {
  timeout: 5000, // 5 seconds
  errorThresholdPercentage: 50, // Open after 50% error rate
  resetTimeout: 30000, // Try to recover after 30 seconds
  volumeThreshold: 5, // Minimum requests to start measuring error rate
  name: "orderServiceBreaker",
};

// Create circuit breaker for order service updates
let orderServiceBreaker = new CircuitBreaker(
  (order, orderServiceUrl) => {
    return axios.put(
      `${orderServiceUrl}/orders/${order.id}`,
      { status: "completed" },
      { headers: { "Content-Type": "application/json" }, timeout: 5000 }
    );
  },
  circuitBreakerOptions
);

orderServiceBreaker.fallback(() => {
  console.warn("[Circuit Breaker] Fallback: Order service unavailable, will retry later");
  return { status: 503, data: { error: "Order service unavailable" } };
});

orderServiceBreaker.on("open", () => {
  console.warn("[Circuit Breaker] ⚠️  OPEN - Too many failures. Stopping requests to order service.");
});

orderServiceBreaker.on("halfOpen", () => {
  console.log("[Circuit Breaker] 🔄 HALF-OPEN - Testing recovery...");
});

orderServiceBreaker.on("close", () => {
  console.log("[Circuit Breaker] ✅ CLOSED - Service recovered. Resuming normal operation.");
});

// Connection status tracking
let connectionState = {
  connected: false,
  attempts: 0,
  lastError: null,
  lastConnectedTime: null,
};

// Export function to get connection status
function getRabbitMQStatus() {
  return { ...connectionState };
}

// Exponential backoff retry logic
async function connectWithRetry(maxAttempts = 30) {
  let conn = null;
  let attempt = 0;

  while (attempt < maxAttempts && !conn) {
    attempt++;
    connectionState.attempts = attempt;

    try {
      console.log(`[RabbitMQ] Connection attempt ${attempt}/${maxAttempts}...`);
      conn = await amqplib.connect(RABBIT_URL);
      connectionState.connected = true;
      connectionState.lastError = null;
      connectionState.lastConnectedTime = new Date().toISOString();
      console.log(`[RabbitMQ] ✅ Connected successfully on attempt ${attempt}`);
      return conn;
    } catch (err) {
      connectionState.lastError = err.message;
      console.error(`[RabbitMQ] ❌ Attempt ${attempt} failed: ${err.message}`);

      if (attempt < maxAttempts) {
        // Exponential backoff: 1s, 2s, 4s, 8s, 16s... (max 30s)
        const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
        console.log(`[RabbitMQ] ⏳ Retrying in ${delayMs}ms...`);
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }

  connectionState.connected = false;
  throw new Error(`Failed to connect to RabbitMQ after ${maxAttempts} attempts`);
}

async function startOrderConsumer(payments) {
  try {
    console.log("[RabbitMQ] Starting payment consumer...");
    const conn = await connectWithRetry();
    const ch = await conn.createChannel();

    // Handle connection close
    conn.on("error", (err) => {
      console.error("[RabbitMQ] Connection error:", err.message);
      connectionState.connected = false;
      connectionState.lastError = err.message;
    });

    conn.on("close", () => {
      console.warn("[RabbitMQ] Connection closed");
      connectionState.connected = false;
    });

    await ch.prefetch(1);

    // Ensure exchange exists and create a dedicated queue for payments
    await ch.assertExchange("order_events", "fanout", { durable: true });
    await ch.assertQueue("payment_queue", { durable: true });
    await ch.bindQueue("payment_queue", "order_events", "");

    console.log("[RabbitMQ] Payment service waiting for messages on 'payment_queue'...");

    ch.consume("payment_queue", async (msg) => {
      if (!msg) return;

      let order;
      try {
        order = JSON.parse(msg.content.toString());
      } catch (e) {
        console.error("[Payment] Failed to parse order message:", e);
        ch.ack(msg);
        return;
      }

      console.log("[Payment] Received order for payment:", order);

      try {
        const amount = order.amount || (order.quantity || 1) * 50000;

        const newPayment = {
          id: payments.length ? payments[payments.length - 1].id + 1 : 1,
          order_id: order.id,
          amount,
          status: "completed",
          method: order.payment_method || "credit_card",
        };

        payments.push(newPayment);
        console.log("[Payment] ✅ Payment recorded:", newPayment);

        // ✅ Update order status in order service using circuit breaker
        try {
          console.log(`[Payment] Updating order ${order.id} status via circuit breaker...`);
          const resp = await orderServiceBreaker.fire(order, ORDER_SERVICE_BASE);
          
          if (resp.status >= 200 && resp.status < 300) {
            console.log(`[Payment] ✅ Order ${order.id} marked as completed (status ${resp.status})`);
          } else {
            console.warn(`[Payment] ⚠️  Order ${order.id} update returned status ${resp.status}`);
          }
        } catch (err) {
          if (orderServiceBreaker.opened) {
            console.warn(`[Payment] ⚠️  Circuit breaker is OPEN. Order ${order.id} update deferred.`);
          } else {
            console.error(`[Payment] ❌ Failed to update order ${order.id}:`, err.message || err);
          }
        }

        ch.ack(msg);
      } catch (err) {
        console.error("[Payment] Error processing payment:", err);
        ch.nack(msg, false, true);
      }
    });
  } catch (err) {
    console.error("[RabbitMQ] Payment consumer error:", err.message);
    connectionState.connected = false;
    connectionState.lastError = err.message;
    
    // Don't exit the process - let K8s handle restart
    // This allows service to startup and become healthy once RabbitMQ is available
    console.log("[RabbitMQ] Service continuing without RabbitMQ. Will retry when RabbitMQ becomes available.");
  }
}

module.exports = { startOrderConsumer, getRabbitMQStatus };
