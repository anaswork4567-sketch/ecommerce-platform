// payment-service/rabbitmq_consumer.js
require("dotenv").config();
const amqplib = require("amqplib");
const axios = require("axios");

const RABBIT_URL =
  process.env.RABBIT_URL || "amqp://guest:guest@rabbitmq:5672";

// Call order service via Kong by default. Can override with ORDER_SERVICE_BASE env.
const ORDER_SERVICE_BASE =
  process.env.ORDER_SERVICE_BASE || "http://order-service:3003";

async function startOrderConsumer(payments) {
  try {
    console.log("Connecting to RabbitMQ for payments...");
    const conn = await amqplib.connect(RABBIT_URL);
  const ch = await conn.createChannel();

  await ch.prefetch(1);

  // Ensure exchange exists and create a dedicated queue for payments
  await ch.assertExchange("order_events", "fanout", { durable: true });
  await ch.assertQueue("payment_queue", { durable: true });
  await ch.bindQueue("payment_queue", "order_events", "");

  console.log("Payment service waiting for messages on 'payment_queue'...");

  ch.consume("payment_queue", async (msg) => {
      if (!msg) return;

      let order;
      try {
        order = JSON.parse(msg.content.toString());
      } catch (e) {
        console.error("Failed to parse order message:", e);
        ch.ack(msg);
        return;
      }

      console.log("Received order for payment:", order);

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
        console.log("Payment recorded:", newPayment);

        // ✅ Update order status in order service to 'completed'
        // Retry PUT to order service up to 3 times with exponential backoff
        const maxAttempts = 3;
        let attempt = 0;
        let putSuccess = false;

        while (attempt < maxAttempts && !putSuccess) {
          attempt += 1;
          try {
            console.log(`Attempt ${attempt}: updating order ${order.id} status via ${ORDER_SERVICE_BASE}/orders/${order.id}`);
            const resp = await axios.put(
              `${ORDER_SERVICE_BASE}/orders/${order.id}`,
              { status: "completed" },
              { headers: { "Content-Type": "application/json" }, timeout: 5000 }
            );
            console.log(`Order ${order.id} marked as completed in order service (status ${resp.status})`);
            putSuccess = true;
          } catch (e) {
            console.error(`Attempt ${attempt} failed to update order ${order.id}:`, e.message || e);
            if (attempt < maxAttempts) {
              const waitMs = 500 * Math.pow(2, attempt - 1);
              console.log(`Waiting ${waitMs}ms before retrying...`);
              await new Promise((r) => setTimeout(r, waitMs));
            }
          }
        }
        if (!putSuccess) {
          console.error(`Failed to mark order ${order.id} completed after ${maxAttempts} attempts`);
        }

        ch.ack(msg);
      } catch (err) {
        console.error("Error processing payment:", err);
        ch.nack(msg, false, true);
      }
    });
  } catch (err) {
    console.error("RabbitMQ payment consumer error:", err);
  }
}

module.exports = { startOrderConsumer };
