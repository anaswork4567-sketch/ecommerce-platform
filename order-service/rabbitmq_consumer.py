import pika
import json
import os
import logging
import time

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

RABBIT_URL = os.getenv('RABBIT_URL', 'amqp://guest:guest@rabbitmq:5672')

def start_consumer():
    """Listen for order_created messages and process them"""
    max_retries = 10
    retry_count = 0
    
    while retry_count < max_retries:
        try:
            logger.info(f"Attempting to connect to RabbitMQ (attempt {retry_count + 1}/{max_retries})...")
            connection = pika.BlockingConnection(pika.URLParameters(RABBIT_URL))
            channel = connection.channel()
            
            # Declare a service-specific queue and bind it to the exchange so this consumer
            # receives a copy of each order event.
            channel.exchange_declare(exchange='order_events', exchange_type='fanout', durable=True)
            channel.queue_declare(queue='order_consumer_queue', durable=True)
            channel.queue_bind(exchange='order_events', queue='order_consumer_queue')
            
            logger.info("✓ Connected to RabbitMQ. Waiting for orders on 'order_created' queue...")
            
            def callback(ch, method, properties, body):
                """Process each order message"""
                order = json.loads(body)
                logger.info(f"📨 Received order: {order}")
                
                try:
                    # Simulate order processing
                    logger.info(f"🔄 Processing order {order['id']} for user {order['user_id']}")
                    # Add your business logic here
                    ch.basic_ack(delivery_tag=method.delivery_tag)
                    logger.info(f"✓ Order {order['id']} processed successfully")
                except Exception as e:
                    logger.error(f"✗ Error processing order: {e}")
                    ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)
            
            channel.basic_consume(
                queue='order_consumer_queue',
                on_message_callback=callback
            )
            
            channel.start_consuming()
        except pika.exceptions.AMQPConnectionError as e:
            retry_count += 1
            logger.error(f"✗ Connection failed: {e}")
            if retry_count < max_retries:
                wait_time = 5
                logger.info(f"⏳ Retrying in {wait_time} seconds...")
                time.sleep(wait_time)
            else:
                logger.error("✗ Max retries reached. Exiting.")
                break
        except Exception as e:
            logger.error(f"✗ Consumer error: {e}")
            break

if __name__ == '__main__':
    start_consumer()
