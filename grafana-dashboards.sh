#!/bin/bash

# Grafana API credentials
GRAFANA_URL="http://192.168.49.2:32320"
ADMIN_USER="admin"
ADMIN_PASSWORD="admin"

# Add Prometheus data source
echo "Adding Prometheus data source..."
curl -X POST "$GRAFANA_URL/api/datasources" \
  -H "Content-Type: application/json" \
  -u "$ADMIN_USER:$ADMIN_PASSWORD" \
  -d '{
    "name": "Prometheus",
    "type": "prometheus",
    "url": "http://prometheus:9090",
    "access": "proxy",
    "isDefault": true
  }'

echo -e "\n\nData source added. Now creating dashboards...\n"

# Create Request Latency Dashboard
echo "Creating Request Latency Dashboard..."
curl -X POST "$GRAFANA_URL/api/dashboards/db" \
  -H "Content-Type: application/json" \
  -u "$ADMIN_USER:$ADMIN_PASSWORD" \
  -d '{
    "dashboard": {
      "title": "Request Latency & Error Rates",
      "description": "HTTP request latency and error rate metrics",
      "tags": ["ecommerce", "performance"],
      "timezone": "browser",
      "panels": [
        {
          "title": "P95 Request Latency (by service)",
          "targets": [
            {
              "expr": "histogram_quantile(0.95, http_request_duration_seconds_bucket)",
              "legendFormat": "{{route}}"
            }
          ],
          "type": "graph",
          "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0}
        },
        {
          "title": "Error Rate (5xx responses)",
          "targets": [
            {
              "expr": "rate(http_request_duration_seconds_count{status_code=~\"5..\"}[5m])",
              "legendFormat": "{{route}}"
            }
          ],
          "type": "graph",
          "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0}
        }
      ]
    }
  }' 2>/dev/null || echo "Dashboard may already exist or there was an error"

# Create Payment Metrics Dashboard
echo "Creating Payment Metrics Dashboard..."
curl -X POST "$GRAFANA_URL/api/dashboards/db" \
  -H "Content-Type: application/json" \
  -u "$ADMIN_USER:$ADMIN_PASSWORD" \
  -d '{
    "dashboard": {
      "title": "Payment Processing Metrics",
      "description": "Payment success rates and amounts",
      "tags": ["ecommerce", "payments"],
      "timezone": "browser",
      "panels": [
        {
          "title": "Total Payments",
          "targets": [
            {
              "expr": "payments_total",
              "legendFormat": "{{status}}"
            }
          ],
          "type": "stat",
          "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0}
        },
        {
          "title": "Total Payment Amount",
          "targets": [
            {
              "expr": "payments_amount_total"
            }
          ],
          "type": "stat",
          "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0}
        }
      ]
    }
  }' 2>/dev/null || echo "Dashboard may already exist or there was an error"

echo -e "\n\nDashboards created successfully!"
