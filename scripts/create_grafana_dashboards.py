#!/usr/bin/env python3
"""
Grafana Dashboard Creation Script for ecommerce-platform
"""
import requests
import json
import sys
import time

GRAFANA_URL = "http://localhost:3000"
PROMETHEUS_URL = "http://prometheus:9090"
ADMIN_USER = "admin"
ADMIN_PASSWORD = "admin"

def create_dashboard(dashboard_json):
    """Create a dashboard in Grafana"""
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Basic {requests.auth._basic_auth_str(ADMIN_USER, ADMIN_PASSWORD).split(' ')[1]}"
    }
    
    try:
        response = requests.post(
            f"{GRAFANA_URL}/api/dashboards/db",
            json=dashboard_json,
            headers=headers,
            timeout=10
        )
        return response.status_code
    except Exception as e:
        print(f"Error: {e}")
        return None

def add_data_source():
    """Add Prometheus data source"""
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Basic {requests.auth._basic_auth_str(ADMIN_USER, ADMIN_PASSWORD).split(' ')[1]}"
    }
    
    payload = {
        "name": "Prometheus",
        "type": "prometheus",
        "url": PROMETHEUS_URL,
        "access": "proxy",
        "isDefault": True
    }
    
    try:
        response = requests.post(
            f"{GRAFANA_URL}/api/datasources",
            json=payload,
            headers=headers,
            timeout=10
        )
        print(f"✓ Prometheus data source added (Status: {response.status_code})")
    except Exception as e:
        print(f"⚠ Data source may already exist")

def main():
    print("=" * 50)
    print("Grafana Dashboard Setup")
    print("=" * 50)
    print()
    
    print("Adding Prometheus Data Source...")
    add_data_source()
    
    time.sleep(1)
    
    # Dashboard 1: Request Latency & Error Rates
    print("\nCreating Dashboard 1: Request Latency & Error Rates...")
    dashboard1 = {
        "dashboard": {
            "title": "Request Latency and Error Rates",
            "description": "HTTP request latency and error rate metrics by service",
            "tags": ["ecommerce", "performance"],
            "timezone": "browser",
            "panels": [
                {
                    "title": "P95 Request Latency (seconds)",
                    "targets": [
                        {
                            "expr": 'histogram_quantile(0.95, http_request_duration_seconds_bucket)',
                            "legendFormat": "{{route}}"
                        }
                    ],
                    "type": "timeseries",
                    "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0}
                },
                {
                    "title": "Error Rate (5xx responses per second)",
                    "targets": [
                        {
                            "expr": 'rate(http_request_duration_seconds_count{status_code=~"5.."}[5m])',
                            "legendFormat": "{{route}}"
                        }
                    ],
                    "type": "timeseries",
                    "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0}
                },
                {
                    "title": "Average Response Time by Service",
                    "targets": [
                        {
                            "expr": 'avg(http_request_duration_seconds) by (route)',
                            "legendFormat": "{{route}}"
                        }
                    ],
                    "type": "timeseries",
                    "gridPos": {"h": 8, "w": 12, "x": 0, "y": 8}
                },
                {
                    "title": "Request Count by Status",
                    "targets": [
                        {
                            "expr": 'sum(http_request_duration_seconds_count) by (status_code)',
                            "legendFormat": "{{status_code}}"
                        }
                    ],
                    "type": "timeseries",
                    "gridPos": {"h": 8, "w": 12, "x": 12, "y": 8}
                }
            ]
        }
    }
    
    status = create_dashboard(dashboard1)
    if status and 200 <= status < 300:
        print(f"✓ Dashboard 1 created (Status: {status})")
    else:
        print(f"⚠ Dashboard 1 may already exist")
    
    time.sleep(1)
    
    # Dashboard 2: Payment Metrics
    print("\nCreating Dashboard 2: Payment Processing Metrics...")
    dashboard2 = {
        "dashboard": {
            "title": "Payment Processing Metrics",
            "description": "Payment success rates, amounts, and volumes",
            "tags": ["ecommerce", "payments"],
            "timezone": "browser",
            "panels": [
                {
                    "title": "Total Payments Processed",
                    "targets": [
                        {
                            "expr": "sum(payments_total)",
                            "legendFormat": "Total Payments"
                        }
                    ],
                    "type": "stat",
                    "gridPos": {"h": 4, "w": 6, "x": 0, "y": 0}
                },
                {
                    "title": "Payment Success Rate (%)",
                    "targets": [
                        {
                            "expr": 'sum(payments_total{status="completed"}) / sum(payments_total) * 100',
                            "legendFormat": "Success %"
                        }
                    ],
                    "type": "stat",
                    "gridPos": {"h": 4, "w": 6, "x": 6, "y": 0}
                },
                {
                    "title": "Total Payment Amount",
                    "targets": [
                        {
                            "expr": "sum(payments_amount_total)",
                            "legendFormat": "Total Amount"
                        }
                    ],
                    "type": "stat",
                    "gridPos": {"h": 4, "w": 6, "x": 12, "y": 0}
                },
                {
                    "title": "Payments by Status",
                    "targets": [
                        {
                            "expr": "sum(payments_total) by (status)",
                            "legendFormat": "{{status}}"
                        }
                    ],
                    "type": "timeseries",
                    "gridPos": {"h": 8, "w": 12, "x": 0, "y": 4}
                },
                {
                    "title": "Payment Processing Rate (per 5min)",
                    "targets": [
                        {
                            "expr": "rate(payments_total[5m])",
                            "legendFormat": "{{status}}"
                        }
                    ],
                    "type": "timeseries",
                    "gridPos": {"h": 8, "w": 12, "x": 12, "y": 4}
                }
            ]
        }
    }
    
    status = create_dashboard(dashboard2)
    if status and 200 <= status < 300:
        print(f"✓ Dashboard 2 created (Status: {status})")
    else:
        print(f"⚠ Dashboard 2 may already exist")
    
    time.sleep(1)
    
    # Dashboard 3: System Health
    print("\nCreating Dashboard 3: System Health & Pod Metrics...")
    dashboard3 = {
        "dashboard": {
            "title": "System Health and Pod Metrics",
            "description": "Kubernetes pod resources and system health",
            "tags": ["ecommerce", "kubernetes", "system"],
            "timezone": "browser",
            "panels": [
                {
                    "title": "Pod Memory Usage (MB)",
                    "targets": [
                        {
                            "expr": 'container_memory_usage_bytes{pod=~".*service.*"} / 1024 / 1024',
                            "legendFormat": "{{pod}}"
                        }
                    ],
                    "type": "timeseries",
                    "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0}
                },
                {
                    "title": "Pod CPU Usage (cores)",
                    "targets": [
                        {
                            "expr": 'rate(container_cpu_usage_seconds_total{pod=~".*service.*"}[5m])',
                            "legendFormat": "{{pod}}"
                        }
                    ],
                    "type": "timeseries",
                    "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0}
                },
                {
                    "title": "Total Kubernetes Pods",
                    "targets": [
                        {
                            "expr": "count(kube_pod_info)",
                            "legendFormat": "Total Pods"
                        }
                    ],
                    "type": "stat",
                    "gridPos": {"h": 4, "w": 6, "x": 0, "y": 8}
                },
                {
                    "title": "Running Pods",
                    "targets": [
                        {
                            "expr": 'count(kube_pod_status_phase{phase="Running"})',
                            "legendFormat": "Running"
                        }
                    ],
                    "type": "stat",
                    "gridPos": {"h": 4, "w": 6, "x": 6, "y": 8}
                }
            ]
        }
    }
    
    status = create_dashboard(dashboard3)
    if status and 200 <= status < 300:
        print(f"✓ Dashboard 3 created (Status: {status})")
    else:
        print(f"⚠ Dashboard 3 may already exist")
    
    print()
    print("=" * 50)
    print("✅ Grafana Dashboard Setup Complete!")
    print("=" * 50)
    print()
    print("Grafana URL: http://localhost:3000")
    print("Login: admin / admin")
    print()
    print("Dashboards Created:")
    print("  1. Request Latency and Error Rates")
    print("  2. Payment Processing Metrics")
    print("  3. System Health and Pod Metrics")
    print()

if __name__ == "__main__":
    main()
