from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import os
import pika
import json
import logging
import atexit

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# RabbitMQ configuration
RABBIT_URL = os.getenv("RABBIT_URL", "amqp://guest:guest@rabbitmq:5672")

# Global RabbitMQ connection (persistent, not created per request)
rabbitmq_connection = None
rabbitmq_channel = None


def setup_rabbitmq():
    """Initialize persistent RabbitMQ connection"""
    global rabbitmq_connection, rabbitmq_channel
    try:
        print("DEBUG: connecting to RabbitMQ with", RABBIT_URL, flush=True)
        rabbitmq_connection = pika.BlockingConnection(pika.URLParameters(RABBIT_URL))
        rabbitmq_channel = rabbitmq_connection.channel()

        # Declare fanout exchange so multiple services can receive events
        rabbitmq_channel.exchange_declare(exchange="order_events", exchange_type="fanout", durable=True)

        print("DEBUG: RabbitMQ connected and ready", flush=True)
        logger.info("RabbitMQ connected and ready")
        return True
    except Exception as e:
        logger.error(f"Failed to connect to RabbitMQ: {e}")
        print("DEBUG: failed to connect to RabbitMQ:", e, flush=True)
        rabbitmq_connection = None
        rabbitmq_channel = None
        return False


def close_rabbitmq():
    """Gracefully close RabbitMQ connection on shutdown"""
    global rabbitmq_connection, rabbitmq_channel
    if rabbitmq_connection and not rabbitmq_connection.is_closed:
        rabbitmq_channel.close()
        rabbitmq_connection.close()
        print("DEBUG: RabbitMQ connection closed", flush=True)
        logger.info("RabbitMQ connection closed")


def publish_order_created(order_data):
    """Publish order created event to RabbitMQ with auto-reconnect"""
    global rabbitmq_connection, rabbitmq_channel

    # If connection/channel died, try to re-establish
    if (
        rabbitmq_connection is None
        or rabbitmq_connection.is_closed
        or rabbitmq_channel is None
        or rabbitmq_channel.is_closed
    ):
        logger.error("RabbitMQ channel is not available, reconnecting...")
        print("DEBUG: RabbitMQ channel not available, reconnecting...", flush=True)
        if not setup_rabbitmq():
            logger.error("Failed to re-establish RabbitMQ connection")
            print("DEBUG: failed to re-establish RabbitMQ connection", flush=True)
            return False

    try:
        body = json.dumps(order_data)
        # Publish to the exchange so all bound queues receive a copy
        rabbitmq_channel.basic_publish(
            exchange="order_events",
            routing_key="",
            body=body,
            properties=pika.BasicProperties(
                delivery_mode=2  # persistent
            ),
        )
        logger.info(f"Published order to RabbitMQ: {order_data}")
        print("DEBUG: published order to RabbitMQ:", body, flush=True)
        return True
    except Exception as e:
        logger.error(f"Error publishing to RabbitMQ: {e}")
        print("DEBUG: error publishing to RabbitMQ:", e, flush=True)
        return False


# Mock database
orders = []


# GET all orders
@app.route("/orders", methods=["GET"])
def get_orders():
    return jsonify(orders), 200


# GET single order
@app.route("/orders/<int:order_id>", methods=["GET"])
def get_order(order_id):
    order = next((o for o in orders if o["id"] == order_id), None)
    if not order:
        return jsonify({"error": "Order not found"}), 404
    return jsonify(order), 200


# CREATE new order
@app.route("/orders", methods=["POST"])
def create_order():
    data = request.get_json()
    new_order = {
        "id": max([o["id"] for o in orders]) + 1 if orders else 1,
        "user_id": data.get("user_id"),
        "product_id": data.get("product_id"),
        "quantity": data.get("quantity"),
        "status": "pending",
        "payment_method": data.get("payment_method", "credit_card"),
        "amount": data.get("amount"),
        "created_at": datetime.now().isoformat(),
    }
    orders.append(new_order)

    print("DEBUG: created order, about to publish:", new_order, flush=True)

    # Publish order created event to RabbitMQ
    publish_order_created(new_order)

    return jsonify(new_order), 201


# UPDATE order status
@app.route("/orders/<int:order_id>", methods=["PUT"])
def update_order(order_id):
    order = next((o for o in orders if o["id"] == order_id), None)
    if not order:
        return jsonify({"error": "Order not found"}), 404

    data = request.get_json() or {}
    order["status"] = data.get("status", order["status"])

    return jsonify(order), 200


# DELETE order
@app.route("/orders/<int:order_id>", methods=["DELETE"])
def delete_order(order_id):
    global orders
    order = next((o for o in orders if o["id"] == order_id), None)
    if not order:
        return jsonify({"error": "Order not found"}), 404

    orders = [o for o in orders if o["id"] != order_id]
    return jsonify({"message": "Order deleted", "order": order}), 200


# HEALTH CHECK
@app.route("/health", methods=["GET"])
def health():
    return jsonify(
        {
            "status": "Order Service UP",
            "timestamp": datetime.now().isoformat(),
            "service": "order-service",
        }
    ), 200


if __name__ == "__main__":
    # Initialize RabbitMQ connection before starting Flask
    setup_rabbitmq()

    # Register cleanup on shutdown
    atexit.register(close_rabbitmq)

    port = int(os.getenv("PORT", 3003))
    # Run without the debugger or reloader to keep the container process stable
    # (debug=True/use_reloader=True can cause restarts and transient connection refusals
    # which lead to upstream failures when Kong routes requests.)
    app.run(host="0.0.0.0", port=port, debug=False, use_reloader=False)
