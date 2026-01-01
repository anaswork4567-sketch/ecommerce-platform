# order-service/rabbitmq_publisher.py
import json
import os
import pika

RABBIT_URL = os.getenv("RABBIT_URL", "amqp://guest:guest@rabbitmq:5672/")

_params = pika.URLParameters(RABBIT_URL)
_connection = None
_channel = None


def _get_channel():
    global _connection, _channel
    if _channel and _channel.is_open:
        return _channel

    if _connection and _connection.is_open:
        _connection.close()

    _connection = pika.BlockingConnection(_params)
    _channel = _connection.channel()
    _channel.queue_declare(queue="order_created", durable=True)
    return _channel


def publish_order_created(order: dict):
    """
    order: dict with at least 'id' and 'quantity'
    """
    ch = _get_channel()
    body = json.dumps(order)
    ch.basic_publish(
        exchange="",
        routing_key="order_created",
        body=body,
        properties=pika.BasicProperties(
            delivery_mode=pika.DeliveryMode.Persistent,
            content_type="application/json",
        ),
    )
    print("Published order_created message:", body)
