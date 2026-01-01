# 📊 Grafana Dashboard Setup Guide

## 🎯 Quick Start

**Grafana URL:** `http://192.168.49.2:32320`  
**Default Credentials:** `admin` / `admin`

---

## Step 1: Add Prometheus Data Source

1. Login to Grafana with admin/admin
2. Click **"Configuration"** (gear icon) → **"Data Sources"**
3. Click **"Add data source"**
4. Select **"Prometheus"**
5. Fill in:
   - **Name:** `Prometheus`
   - **URL:** `http://prometheus:9090`
   - **Access:** `Proxy`
   - Check **"Default"**
6. Click **"Save & Test"**

---

## Step 2: Create Dashboard 1 - Request Latency & Error Rates

### Dashboard Details
- **Title:** Request Latency & Error Rates
- **Description:** HTTP request latency and error rate metrics

### Panels to Create:

#### Panel 1: P95 Request Latency
- **Query:** `histogram_quantile(0.95, http_request_duration_seconds_bucket)`
- **Legend:** `{{route}}`
- **Visualization:** Time series graph
- **Position:** Top-left (8x12)

#### Panel 2: Error Rate (5xx responses)
- **Query:** `rate(http_request_duration_seconds_count{status_code=~"5.."}[5m])`
- **Legend:** `{{route}}`
- **Visualization:** Time series graph
- **Position:** Top-right (8x12)

#### Panel 3: Average Response Time
- **Query:** `avg(http_request_duration_seconds) by (route)`
- **Legend:** `{{route}}`
- **Visualization:** Time series graph
- **Position:** Bottom-left (8x12)

#### Panel 4: Request Count by Status
- **Query:** `sum(http_request_duration_seconds_count) by (status_code)`
- **Legend:** `{{status_code}}`
- **Visualization:** Time series graph
- **Position:** Bottom-right (8x12)

---

## Step 3: Create Dashboard 2 - Payment Metrics

### Dashboard Details
- **Title:** Payment Processing Metrics
- **Description:** Payment success rates and transaction amounts

### Panels to Create:

#### Panel 1: Total Payments
- **Query:** `sum(payments_total)`
- **Visualization:** Stat
- **Position:** Top-left (4x6)

#### Panel 2: Success Rate
- **Query:** `sum(payments_total{status="completed"}) / sum(payments_total) * 100`
- **Visualization:** Stat
- **Unit:** Percent
- **Position:** Top-middle (4x6)

#### Panel 3: Total Amount
- **Query:** `payments_amount_total`
- **Visualization:** Stat
- **Position:** Top-right (4x6)

#### Panel 4: Payments by Status
- **Query:** `sum(payments_total) by (status)`
- **Legend:** `{{status}}`
- **Visualization:** Time series
- **Position:** Bottom-left (8x12)

#### Panel 5: Payment Rate
- **Query:** `rate(payments_total[5m])`
- **Legend:** `{{status}}`
- **Visualization:** Time series
- **Position:** Bottom-right (8x12)

---

## Step 4: Create Dashboard 3 - System Health

### Dashboard Details
- **Title:** System Health & Pod Metrics
- **Description:** Kubernetes pod resources and system health

### Panels to Create:

#### Panel 1: Pod Memory Usage
- **Query:** `container_memory_usage_bytes{pod=~".*service.*"} / 1024 / 1024`
- **Legend:** `{{pod}}`
- **Visualization:** Time series
- **Position:** Top-left (8x12)

#### Panel 2: Pod CPU Usage
- **Query:** `rate(container_cpu_usage_seconds_total{pod=~".*service.*"}[5m])`
- **Legend:** `{{pod}}`
- **Visualization:** Time series
- **Position:** Top-right (8x12)

#### Panel 3: Total Pods
- **Query:** `count(kube_pod_info)`
- **Visualization:** Stat
- **Position:** Bottom-left (4x6)

#### Panel 4: Running Pods
- **Query:** `count(kube_pod_status_phase{phase="Running"})`
- **Visualization:** Stat
- **Position:** Bottom-middle (4x6)

---

## Step 5: Verify Dashboards

1. Go to **"Home"** icon (top-left)
2. You should see all 3 dashboards listed
3. Click each to view metrics

---

## 📊 Key Metrics to Monitor

### Performance Metrics
- **P95 Latency:** Should be < 1 second
- **Error Rate:** Should be < 1%
- **Response Time Avg:** Should be < 200ms

### Payment Metrics
- **Success Rate:** Should be > 99%
- **Total Payments:** Cumulative
- **Payment Rate:** Payments per second

### System Health
- **Pod Memory:** Each pod < 500Mi
- **Pod CPU:** Each pod < 100m (idle)
- **Running Pods:** Should be 13 (5 services × 2 + 3 infrastructure)

---

## 🔄 Refresh Intervals

Set dashboard refresh to:
- **Performance Dashboard:** 30 seconds
- **Payment Dashboard:** 1 minute
- **System Dashboard:** 1 minute

---

## 📝 Notes

- Prometheus is configured with a 15-second scrape interval
- Data retention is set to 30 days
- All metrics are automatically discovered from pod annotations

