# Prometheus + Grafana Monitoring Setup

## ✅ Monitoring Infrastructure Deployed

### Components Installed

#### 1. **Prometheus Server**
- **Purpose**: Metrics collection and time-series database
- **Namespace**: `monitoring`
- **Container Image**: `prom/prometheus:latest`
- **Port**: 9090 (LoadBalancer)
- **Storage**: 30-day retention
- **CPU/Memory**: 250m/512Mi requests, 500m/1Gi limits

#### 2. **Grafana Dashboard**
- **Purpose**: Visualization and alerting
- **Namespace**: `monitoring`
- **Container Image**: `grafana/grafana:latest`
- **Port**: 3000 (LoadBalancer)
- **Default Credentials**: admin/admin
- **Storage**: EmptyDir (in-memory)

### Service Configuration

```
Prometheus:
  Service Name: prometheus
  Cluster IP: 10.97.127.155
  NodePort: 30363
  Access: LoadBalancer pending (available via port 30363)

Grafana:
  Service Name: grafana
  Cluster IP: 10.102.0.143
  NodePort: 32320
  Access: LoadBalancer pending (available via port 32320)
```

### Metrics Instrumentation

#### Payment Service Metrics
Added to `payment-service/app.js`:
- **http_request_duration_seconds** - HTTP request latency (histogram)
- **payments_total** - Total payments counter
- **payments_amount_total** - Total payment amounts (gauge)
- **Default metrics** - CPU, memory, GC, etc. (auto-collected)

Metrics endpoint: `/metrics` on port 3004

#### Kubernetes Annotations
All service deployments configured with Prometheus scrape annotations:
```yaml
annotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: "3004"      # service port
  prometheus.io/path: "/metrics"  # metrics endpoint
```

### Prometheus Configuration

**Scrape Jobs Configured:**
1. **prometheus** - Prometheus itself
2. **kubernetes-apiservers** - API server metrics
3. **kubernetes-nodes** - Node metrics
4. **kubernetes-pods** - Auto-discovered pod metrics

**Scrape Interval**: 15 seconds
**Evaluation Interval**: 15 seconds
**Data Retention**: 30 days

### RBAC Setup

Created:
- **ServiceAccount**: `prometheus` in monitoring namespace
- **ClusterRole**: `prometheus` with permissions to:
  - Get/list/watch nodes, services, endpoints, pods, ingresses
- **ClusterRoleBinding**: Binds ServiceAccount to ClusterRole

## 🎯 Access Instructions

### Via Minikube Tunnel

```bash
minikube tunnel
```

Then access:
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000

### Direct Access (NodePort)

```bash
# Get NodePort IP
kubectl get nodes -o wide

# Access via NodePort
http://<minikube-ip>:30363  # Prometheus
http://<minikube-ip>:32320  # Grafana
```

## 📊 Prometheus Queries

Try these in Prometheus (http://localhost:9090):

```promql
# HTTP request latency (95th percentile)
histogram_quantile(0.95, http_request_duration_seconds_bucket)

# Request rate per service
rate(http_request_duration_seconds_count[5m])

# Total payments
payments_total

# Payment amount total
payments_amount_total

# Pod CPU usage
container_cpu_usage_seconds_total

# Pod memory usage
container_memory_usage_bytes

# Container restarts
kube_pod_container_status_restarts_total
```

## 🎨 Grafana Setup

### Login
1. Access http://localhost:3000
2. Username: `admin`
3. Password: `admin`

### Add Prometheus Data Source
1. Click "Connections" → "Data sources"
2. Click "Add data source"
3. Select "Prometheus"
4. URL: `http://prometheus:9090` (use Kubernetes DNS)
5. Click "Save & test"

### Create Dashboards
1. Click "+" → "Dashboard"
2. Click "Add visualization"
3. Choose "Prometheus" data source
4. Write PromQL queries from above

### Pre-built Dashboards (Import)
Grafana has built-in dashboards for:
- Kubernetes cluster monitoring
- Node exporter metrics
- Custom application metrics

## 📝 Files Created

- `k8s/prometheus-deployment.yaml` - Prometheus ConfigMap, Deployment, Service, RBAC
- `k8s/grafana-deployment.yaml` - Grafana Deployment & Service
- `payment-service/app.js` - Updated with Prometheus instrumentation
- `payment-service/package.json` - Added prom-client dependency
- `k8s/order-deployment.yaml` - Added Prometheus annotations
- `k8s/payment-deployment.yaml` - Added Prometheus annotations

## ✅ Verification Commands

```bash
# Check monitoring namespace
kubectl get all -n monitoring

# View Prometheus logs
kubectl logs -n monitoring deployment/prometheus

# View Grafana logs
kubectl logs -n monitoring deployment/grafana

# Port-forward for local access (alternative to LoadBalancer)
kubectl port-forward -n monitoring svc/prometheus 9090:9090 &
kubectl port-forward -n monitoring svc/grafana 3000:3000 &
```

## 🚀 Next Steps

1. ✅ **Prometheus + Grafana**: Deployed and running
2. ⏳ **Custom Dashboards**: Create dashboards for:
   - Request latency by service
   - Error rates
   - Payment processing metrics
   - RabbitMQ queue depth
3. ⏳ **Alerting Rules**: Define alerts for:
   - High error rates
   - Slow response times
   - Pod restarts
4. ⏳ **Log Aggregation**: Add ELK or Loki for logs

## 📊 Status: ✅ MONITORING DEPLOYED

All Prometheus and Grafana components are running and ready for visualization!
