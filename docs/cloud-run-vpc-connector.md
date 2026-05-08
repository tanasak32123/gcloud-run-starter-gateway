# Cloud Run Internal Ingress with VPC Connector

## Architecture

```mermaid
flowchart LR
    Client(["Client"])

    subgraph GCP ["Google Cloud Platform"]
        subgraph Gateway ["Cloud Run — Gateway"]
            GW["gateway service\n(allUsers invoker)"]
        end

        VPC["VPC Connector\ncloud-run-connector\n10.8.0.0/28"]

        subgraph UserAPI ["Cloud Run — User API"]
            UA["user-api service\n(internal ingress only)"]
        end

        Meta["GCE Metadata Server\n(ID Token)"]
    end

    Client -->|"HTTP request"| GW
    GW -->|"fetchIdToken(audience)"| Meta
    Meta -->|"ID Token"| GW
    GW -->|"via VPC Connector\nAuthorization: Bearer <token>"| VPC
    VPC -->|"internal traffic"| UA

    style GW fill:#4285f4,color:#fff
    style UA fill:#34a853,color:#fff
    style Meta fill:#fbbc04,color:#000
    style VPC fill:#ea4335,color:#fff
```

### IAM Policy

| Service | Member | Role |
|---|---|---|
| gateway | `allUsers` | `roles/run.invoker` |
| user-api | `gateway-sa@...` | `roles/run.invoker` |

---

## ขั้นตอน

### 1. สร้าง VPC Connector

```bash
gcloud compute networks vpc-access connectors create cloud-run-connector \
  --region europe-west1 \
  --range 10.8.0.0/28 \
  --min-instances 2 \
  --max-instances 3 \
  --machine-type e2-micro
```

### 2. Attach VPC Connector ให้ gateway

```bash
gcloud run services update <GATEWAY_SERVICE_NAME> \
  --region europe-west1 \
  --vpc-connector cloud-run-connector \
  --vpc-egress all-traffic
```

### 3. ตั้ง user-api เป็น internal ingress

```bash
gcloud run services update gcloud-run-starter-user-api \
  --region europe-west1 \
  --ingress internal
```

> code ไม่ต้องแก้ — URL เดิมใช้ได้เลย

---

## Cost

| รายการ | ราคา |
|---|---|
| VPC Connector (e2-micro × 2 instances) | ~$14/เดือน |
| Egress traffic ผ่าน connector | $0.01/GB |

รวมประมาณ **$14-20/เดือน** — ไม่มี free tier

---

## เปรียบเทียบกับ IAM + `--ingress all`

| | IAM + ingress all | VPC Connector + internal ingress |
|---|---|---|
| Security | IAM-based | IAM + network isolation |
| Cost | ฟรี | ~$14/เดือน |
| Setup | ง่าย | ซับซ้อนกว่า |
| Compliance | ส่วนใหญ่เพียงพอ | เหมาะกับ strict network policy |
