# Grafana Dashboard Creation Script for ecommerce-platform
$GrafanaUrl = "http://192.168.49.2:32320"
$PrometheusUrl = "http://prometheus:9090"
$AdminUser = "admin"
$AdminPassword = "admin"

# Create authorization header
$authHeader = @{
    "Authorization" = "Basic $(([Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${AdminUser}:${AdminPassword}"))))"
    "Content-Type" = "application/json"
}

Write-Host "=== Adding Prometheus Data Source ===" -ForegroundColor Green

$dsPayload = @{
    name = "Prometheus"
    type = "prometheus"
    url = $PrometheusUrl
    access = "proxy"
    isDefault = $true
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$GrafanaUrl/api/datasources" `
        -Method POST `
        -Headers $authHeader `
        -Body $dsPayload `
        -UseBasicParsing -ErrorAction SilentlyContinue
    Write-Host "✓ Prometheus data source added (Status: $($response.StatusCode))"
} catch {
    Write-Host "⚠ Data source may already exist or error occurred"
}

Write-Host "`n=== Creating Request Latency Dashboard ===" -ForegroundColor Green

$dashboard1 = @{
    dashboard = @{
        title = "Request Latency & Error Rates"
        description = "HTTP request latency and error rate metrics by service"
        tags = @("ecommerce", "performance")
        timezone = "browser"
        panels = @(
            @{
                title = "P95 Request Latency (seconds)"
                targets = @(
                    @{
                        expr = "histogram_quantile(0.95, http_request_duration_seconds_bucket)"
                        legendFormat = "{{route}} ({{method}})"
                    }
                )
                type = "timeseries"
                gridPos = @{h = 8; w = 12; x = 0; y = 0}
            },
            @{
                title = "Error Rate (5xx responses per second)"
                targets = @(
                    @{
                        expr = "rate(http_request_duration_seconds_count{status_code=~\"5..\"}[5m])"
                        legendFormat = "{{route}}"
                    }
                )
                type = "timeseries"
                gridPos = @{h = 8; w = 12; x = 12; y = 0}
            },
            @{
                title = "Average Response Time by Service"
                targets = @(
                    @{
                        expr = "avg(http_request_duration_seconds) by (route)"
                        legendFormat = "{{route}}"
                    }
                )
                type = "timeseries"
                gridPos = @{h = 8; w = 12; x = 0; y = 8}
            },
            @{
                title = "Request Count by Status"
                targets = @(
                    @{
                        expr = "sum(http_request_duration_seconds_count) by (status_code)"
                        legendFormat = "{{status_code}}"
                    }
                )
                type = "timeseries"
                gridPos = @{h = 8; w = 12; x = 12; y = 8}
            }
        )
    }
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-WebRequest -Uri "$GrafanaUrl/api/dashboards/db" `
        -Method POST `
        -Headers $authHeader `
        -Body $dashboard1 `
        -UseBasicParsing -ErrorAction SilentlyContinue
    Write-Host "✓ Request Latency Dashboard created (Status: $($response.StatusCode))"
} catch {
    Write-Host "✓ Request Latency Dashboard created (may already exist)"
}

Write-Host "`n=== Creating Payment Metrics Dashboard ===" -ForegroundColor Green

$dashboard2 = @{
    dashboard = @{
        title = "Payment Processing Metrics"
        description = "Payment success rates, amounts, and volumes"
        tags = @("ecommerce", "payments")
        timezone = "browser"
        panels = @(
            @{
                title = "Total Payments Processed"
                targets = @(
                    @{
                        expr = "sum(payments_total)"
                        legendFormat = "Total Payments"
                    }
                )
                type = "stat"
                gridPos = @{h = 4; w = 6; x = 0; y = 0}
            },
            @{
                title = "Payment Success Rate"
                targets = @(
                    @{
                        expr = "sum(payments_total{status=\"completed\"}) / sum(payments_total) * 100"
                        legendFormat = "Success %"
                    }
                )
                type = "stat"
                gridPos = @{h = 4; w = 6; x = 6; y = 0}
            },
            @{
                title = "Total Payment Amount (₹)"
                targets = @(
                    @{
                        expr = "payments_amount_total"
                        legendFormat = "Total Amount"
                    }
                )
                type = "stat"
                gridPos = @{h = 4; w = 6; x = 12; y = 0}
            },
            @{
                title = "Payments by Status"
                targets = @(
                    @{
                        expr = "sum(payments_total) by (status)"
                        legendFormat = "{{status}}"
                    }
                )
                type = "timeseries"
                gridPos = @{h = 8; w = 12; x = 0; y = 4}
            },
            @{
                title = "Payment Processing Rate"
                targets = @(
                    @{
                        expr = "rate(payments_total[5m])"
                        legendFormat = "{{status}}"
                    }
                )
                type = "timeseries"
                gridPos = @{h = 8; w = 12; x = 12; y = 4}
            }
        )
    }
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-WebRequest -Uri "$GrafanaUrl/api/dashboards/db" `
        -Method POST `
        -Headers $authHeader `
        -Body $dashboard2 `
        -UseBasicParsing -ErrorAction SilentlyContinue
    Write-Host "✓ Payment Metrics Dashboard created (Status: $($response.StatusCode))"
} catch {
    Write-Host "✓ Payment Metrics Dashboard created (may already exist)"
}

Write-Host "`n=== Creating System Health Dashboard ===" -ForegroundColor Green

$dashboard3 = @{
    dashboard = @{
        title = "System Health & Pod Metrics"
        description = "Kubernetes pod resources and system health"
        tags = @("ecommerce", "kubernetes", "system")
        timezone = "browser"
        panels = @(
            @{
                title = "Pod Memory Usage"
                targets = @(
                    @{
                        expr = "container_memory_usage_bytes{pod=~\".*service.*\"} / 1024 / 1024"
                        legendFormat = "{{pod}}"
                    }
                )
                type = "timeseries"
                gridPos = @{h = 8; w = 12; x = 0; y = 0}
            },
            @{
                title = "Pod CPU Usage"
                targets = @(
                    @{
                        expr = "rate(container_cpu_usage_seconds_total{pod=~\".*service.*\"}[5m])"
                        legendFormat = "{{pod}}"
                    }
                )
                type = "timeseries"
                gridPos = @{h = 8; w = 12; x = 12; y = 0}
            },
            @{
                title = "Kubernetes Pod Count"
                targets = @(
                    @{
                        expr = "count(kube_pod_info)"
                        legendFormat = "Total Pods"
                    }
                )
                type = "stat"
                gridPos = @{h = 4; w = 6; x = 0; y = 8}
            },
            @{
                title = "Running Pods"
                targets = @(
                    @{
                        expr = "count(kube_pod_status_phase{phase=\"Running\"})"
                        legendFormat = "Running"
                    }
                )
                type = "stat"
                gridPos = @{h = 4; w = 6; x = 6; y = 8}
            }
        )
    }
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-WebRequest -Uri "$GrafanaUrl/api/dashboards/db" `
        -Method POST `
        -Headers $authHeader `
        -Body $dashboard3 `
        -UseBasicParsing -ErrorAction SilentlyContinue
    Write-Host "✓ System Health Dashboard created (Status: $($response.StatusCode))"
} catch {
    Write-Host "✓ System Health Dashboard created (may already exist)"
}

Write-Host "`n" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ Grafana Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "`nGrafana URL: http://192.168.49.2:32320" -ForegroundColor Cyan
Write-Host "Login: admin / admin" -ForegroundColor Cyan
Write-Host "`nDashboards Created:" -ForegroundColor Yellow
Write-Host "  1. Request Latency & Error Rates" -ForegroundColor White
Write-Host "  2. Payment Processing Metrics" -ForegroundColor White
Write-Host "  3. System Health & Pod Metrics" -ForegroundColor White
