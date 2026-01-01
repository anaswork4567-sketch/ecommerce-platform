#!/bin/bash
# Grafana Dashboard Creation Script

GRAFANA_URL="http://localhost:3000"
PROMETHEUS_URL="http://prometheus:9090"
ADMIN_USER="admin"
ADMIN_PASSWORD="admin"

# Create auth header
AUTH_HEADER="Authorization: Basic $(echo -n "${ADMIN_USER}:${ADMIN_PASSWORD}" | base64)"

echo "=== Adding Prometheus Data Source ==="

curl -X POST "$GRAFANA_URL/api/datasources" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d '{
    "name": "Prometheus",
    "type": "prometheus",
    "url": "'$PROMETHEUS_URL'",
    "access": "proxy",
    "isDefault": true
  }' 2>/dev/null || echo "✓ Data source already exists"

echo ""
echo "=== Creating Dashboards ==="

# Dashboard 1: Request Latency
echo "Creating Request Latency Dashboard..."
curl -X POST "$GRAFANA_URL/api/dashboards/db" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d '{
    "dashboard": {
      "title": "Request Latency and Error Rates",
      "description": "HTTP request latency and error rate metrics",
      "tags": ["ecommerce", "performance"],
      "timezone": "browser",
      "panels": [
        {
          "title": "P95 Request Latency",
          "targets": [{"expr": "histogram_quantile(0.95, http_request_duration_seconds_bucket)"}],
          "type": "timeseries",
          "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0}
        },
        {
          "title": "Error Rate",
          "targets": [{"expr": "rate(http_request_duration_seconds_count{status_code=~\"5..\"}[5m])"}],
          "type": "timeseries",
          "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0}
        }
      ]
    }
  }' 2>/dev/null

# Dashboard 2: Payment Metrics
echo "✓ Creating Payment Processing Dashboard..."
curl -X POST "$GRAFANA_URL/api/dashboards/db" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d '{
    "dashboard": {
      "title": "Payment Processing Metrics",
      "description": "Payment metrics and volumes",
      "tags": ["ecommerce", "payments"],
      "timezone": "browser",
      "panels": [
        {
          "title": "Total Payments",
          "targets": [{"expr": "sum(payments_total)"}],
          "type": "stat",
          "gridPos": {"h": 4, "w": 6, "x": 0, "y": 0}
        },
        {
          "title": "Payment Success Rate",
          "targets": [{"expr": "sum(payments_total{status=\"completed\"}) / sum(payments_total) * 100"}],
          "type": "stat",
          "gridPos": {"h": 4, "w": 6, "x": 6, "y": 0}
        }
      ]
    }
  }' 2>/dev/null

# Dashboard 3: System Health
echo "✓ Creating System Health Dashboard..."
curl -X POST "$GRAFANA_URL/api/dashboards/db" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d '{
    "dashboard": {
      "title": "System Health and Pod Metrics",
      "description": "Kubernetes pod metrics",
      "tags": ["ecommerce", "kubernetes"],
      "timezone": "browser",
      "panels": [
        {
          "title": "Pod Memory Usage",
          "targets": [{"expr": "container_memory_usage_bytes{pod=~\".*service.*\"} / 1024 / 1024"}],
          "type": "timeseries",
          "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0}
        }
      ]
    }
  }' 2>/dev/null

echo ""
echo "========================================="
echo "✅ Grafana Dashboards Created!"
echo "========================================="
echo ""
echo "Grafana URL: http://localhost:3000"
echo "Login: admin / admin"
