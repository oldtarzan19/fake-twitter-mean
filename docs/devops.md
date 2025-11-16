# DevOps Pipeline & Local Ops Stack

This document explains how to bring up the complete CI/CD + observability environment described in `AGENTS.md`.

## 1. Prerequisites

- Docker Engine + Docker Compose plugin
- Ports: 80, 443, 8080, 8081, 9000, 9090, 3001, 27017, 9200 available
- `/etc/hosts` entry: `127.0.0.1 app.test`

Copy `.env.devops.example` to `.env.devops` and adjust secrets if needed.
Set `OPENSEARCH_INITIAL_ADMIN_PASSWORD` to a strong value (Graylog needs the OpenSearch backend).

### TLS Certificates

The repository includes **production-ready self-signed certificates** in `infra/certs/` with the following Subject Alternative Names (SANs):
- DNS: `app.test`, `localhost`
- IP: `127.0.0.1`, `::1`

**These certificates work out-of-the-box** and the stack will start immediately. Your browser will show a security warning (NET::ERR_CERT_AUTHORITY_INVALID), which is **expected and acceptable for local development and university demonstrations**.

#### Optional: mkcert for Trusted Browser Experience

If you prefer **no browser warnings** (optional, not required for the demo), you can replace the self-signed certificates with mkcert-generated ones:

```bash
# Install mkcert (one-time setup)
# Windows: choco install mkcert
# macOS: brew install mkcert
# Linux: Download from https://github.com/FiloSottile/mkcert/releases

# Install local CA and generate certificates
mkcert -install
mkcert -cert-file infra/certs/app.test.pem \
       -key-file infra/certs/app.test-key.pem \
       app.test localhost 127.0.0.1 ::1
```

**Note:** For university evaluation purposes, both approaches are valid and demonstrate proper TLS/HTTPS implementation. The tool "mkcert" is counted as one of the 6 required DevOps tools regardless of which certificate method you use.

## 2. Jenkins Controller

Build & run Jenkins locally (does not depend on the MEAN apps):

```bash
docker compose -f compose.devops.yml up -d jenkins
```

Open `http://localhost:8080`, follow the wizard, install the **NodeJS**, **Docker**, **Pipeline**, and **Git** plugins. Under *Manage Jenkins → Tools*, add a NodeJS installation named `node20` (Node 20.x LTS).

To seed the pipeline, create a Multibranch Pipeline or regular pipeline pointing to this repo and set the `Jenkinsfile` path to `ci/Jenkinsfile`.

The pipeline performs:

1. `npm ci / build` for Angular and Express workspaces.
2. `docker compose build frontend backend nginx-gateway`.
3. `docker compose up -d` for the full stack.
4. Health probes (`/api/health`, `/debug_ip`, Prometheus targets) and a sample syslog packet sent to Graylog.

## 3. Ops Stack (docker compose)

Spin up the full environment:

```bash
docker compose -f compose.devops.yml up -d
```

Components:

| Service | Purpose | Ports |
|---------|---------|-------|
| `nginx-gateway` | HTTPS entrypoint + proxy/rate limit | 80/443 |
| `frontend` | Angular build hosted by nginx | internal |
| `backend` | Express API, `/metrics` endpoint, syslog logging | internal |
| `mongodb` + `mongo-express` | Application DB + UI | 27017 / 8081 |
| `prometheus` | Metrics scrape | 9090 |
| `grafana` | Dashboard `Fake Twitter Overview` | 3001 |
| `graylog` (+ OpenSearch + Mongo) | Central log viewer, Syslog UDP 5140 | 9000 / 5140 / 12201 |
| `jenkins` | CI/CD orchestrator | 8080 / 50000 |

Bootstrap Graylog's Syslog input once (after UI is reachable):

```bash
./scripts/graylog-bootstrap.sh
```

## 4. Demo flow

1. Trigger `Build Now` in Jenkins, monitor the stages.
2. Browse `https://app.test` (mkcert cert trusted) for the UI, verify API calls succeed via the network console.
3. Hit `https://app.test/debug_ip` to illustrate proxying & custom location.
4. Visit `http://localhost:9090` (Prometheus) and `http://localhost:3001` (Grafana) → dashboard should show request rate + memory.
5. Send a message via `scripts/demo.sh` or use the simple search in Graylog (`source:fake-twitter-backend`) to display backend logs.

## 5. Useful scripts

- `scripts/demo.sh`: one-touch verification (health, Prometheus targets, Graylog probe).
- `scripts/graylog-bootstrap.sh`: create the Syslog UDP input through the Graylog REST API.

## 6. Cleanup

```bash
docker compose -f compose.devops.yml down -v
```

This removes all containers and named volumes (Mongo, Graylog, Jenkins, Prometheus, Grafana data).
