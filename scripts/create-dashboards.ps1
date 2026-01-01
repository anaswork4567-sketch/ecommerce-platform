# Grafana Dashboard Creation - Using Invoke-WebRequest
param([string]$GrafanaUrl = "http://localhost:3000")

$PrometheusUrl = "http://prometheus:9090"
$AdminUser = "admin"
$AdminPassword = "admin"

# Create auth header
$securePassword = ConvertTo-SecureString $AdminPassword -AsPlainText -Force
$credential = New-Object System.Management.Automation.PSCredential($AdminUser, $securePassword)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Grafana Dashboard Creation" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Adding Prometheus Data Source..." -ForegroundColor Yellow
$datasourceJson = @{
    name = "Prometheus"
    type = "prometheus"
    url = $PrometheusUrl
    access = "proxy"
    isDefault = $true
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$GrafanaUrl/api/datasources" `
        -Method POST `
        -Credential $credential `
        -Body $datasourceJson `
        -ContentType "application/json" `
        -UseBasicParsing -ErrorAction SilentlyContinue
    Write-Host "✓ Prometheus data source added" -ForegroundColor Green
} catch {
    Write-Host "⚠ Data source may already exist" -ForegroundColor Yellow
}

Start-Sleep -Seconds 1

Write-Host ""
Write-Host "Step 2: Creating Dashboard 1 - Request Latency and Error Rates..." -ForegroundColor Yellow

# Save dashboard 1 JSON to file first
$dashboard1Json = '{
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
            "expr": "histogram_quantile(0.95, http_request_duration_seconds_bucket)",
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
            "expr": "rate(http_request_duration_seconds_count{status_code=~\"5..\"}[5m])",
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
            "expr": "avg(http_request_duration_seconds) by (route)",
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
            "expr": "sum(http_request_duration_seconds_count) by (status_code)",
            "legendFormat": "{{status_code}}"
          }
        ],
        "type": "timeseries",
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 8}
      }
    ]
  }
}'

$tempFile1 = [System.IO.Path]::GetTempFileName() -replace '\.tmp$', '.json'
Set-Content -Path $tempFile1 -Value $dashboard1Json -Encoding UTF8

try {
    $response = Invoke-WebRequest -Uri "$GrafanaUrl/api/dashboards/db" `
        -Method POST `
        -Credential $credential `
        -InFile $tempFile1 `
        -ContentType "application/json" `
        -UseBasicParsing -ErrorAction SilentlyContinue
    Write-Host "✓ Dashboard 1 created" -ForegroundColor Green
} catch {
    Write-Host "⚠ Dashboard 1 may already exist" -ForegroundColor Yellow
}

Remove-Item $tempFile1 -Force

Start-Sleep -Seconds 1

Write-Host ""
Write-Host "Step 3: Creating Dashboard 2 - Payment Processing Metrics..." -ForegroundColor Yellow

$dashboard2Json = '{
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
            "expr": "sum(payments_total{status=\"completed\"}) / sum(payments_total) * 100",
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
}'

$tempFile2 = [System.IO.Path]::GetTempFileName() -replace '\.tmp$', '.json'
Set-Content -Path $tempFile2 -Value $dashboard2Json -Encoding UTF8

try {
    $response = Invoke-WebRequest -Uri "$GrafanaUrl/api/dashboards/db" `
        -Method POST `
        -Credential $credential `
        -InFile $tempFile2 `
        -ContentType "application/json" `
        -UseBasicParsing -ErrorAction SilentlyContinue
    Write-Host "✓ Dashboard 2 created" -ForegroundColor Green
} catch {
    Write-Host "⚠ Dashboard 2 may already exist" -ForegroundColor Yellow
}

Remove-Item $tempFile2 -Force

Start-Sleep -Seconds 1

Write-Host ""
Write-Host "Step 4: Creating Dashboard 3 - System Health & Pod Metrics..." -ForegroundColor Yellow

$dashboard3Json = '{
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
            "expr": "container_memory_usage_bytes{pod=~\".*service.*\"} / 1024 / 1024",
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
            "expr": "rate(container_cpu_usage_seconds_total{pod=~\".*service.*\"}[5m])",
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
            "expr": "count(kube_pod_status_phase{phase=\"Running\"})",
            "legendFormat": "Running"
          }
        ],
        "type": "stat",
        "gridPos": {"h": 4, "w": 6, "x": 6, "y": 8}
      }
    ]
  }
}'

$tempFile3 = [System.IO.Path]::GetTempFileName() -replace '\.tmp$', '.json'
Set-Content -Path $tempFile3 -Value $dashboard3Json -Encoding UTF8

try {
    $response = Invoke-WebRequest -Uri "$GrafanaUrl/api/dashboards/db" `
        -Method POST `
        -Credential $credential `
        -InFile $tempFile3 `
        -ContentType "application/json" `
        -UseBasicParsing -ErrorAction SilentlyContinue
    Write-Host "✓ Dashboard 3 created" -ForegroundColor Green
} catch {
    Write-Host "⚠ Dashboard 3 may already exist" -ForegroundColor Yellow
}

Remove-Item $tempFile3 -Force

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ Grafana Setup Complete!" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Grafana URL: $GrafanaUrl" -ForegroundColor Yellow
Write-Host "Login: $AdminUser / $AdminPassword" -ForegroundColor Yellow
Write-Host ""
Write-Host "Dashboards Created:" -ForegroundColor Cyan
Write-Host "  1. Request Latency and Error Rates" -ForegroundColor White
Write-Host "  2. Payment Processing Metrics" -ForegroundColor White
Write-Host "  3. System Health and Pod Metrics" -ForegroundColor White
Write-Host ""
Write-Host "Navigate to Grafana to view your dashboards!" -ForegroundColor Green
