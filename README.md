# Fake Twitter MEAN + Local DevOps Stack

Lokális, bemutatható MEAN alkalmazás teljes CI/CD + observability lánccal (Jenkins → Docker Compose → Nginx → Prometheus/Grafana → Graylog). Cloud nincs, minden Docker/Compose alapon fut.

## 1) Előfeltételek

- Docker Engine + Compose plugin
- Szabad portok: 80, 443, 8080, 8081, 9000, 9090, 3001, 27017, 9200, 5140/udp
- Hosts bejegyzés az `app.test` domainre:
  - Windows: `C:\Windows\System32\drivers\etc\hosts` → `127.0.0.1 app.test`
  - Linux/macOS/WSL: `/etc/hosts` → `127.0.0.1 app.test`
- Másold az env fájlt: `cp .env.devops.example .env.devops`, állítsd be a jelszavakat (pl. `OPENSEARCH_INITIAL_ADMIN_PASSWORD`, `SESSION_SECRET`, Grafana/Graylog admin PW).

## 2) TLS (self-signed + mkcert opció)

- Out-of-the-box self-signed cert van az `infra/certs/` alatt (`app.test.pem`, `app.test-key.pem`, SAN: `app.test`, `localhost`, `127.0.0.1`, `::1`).
- mkcert (opcionális, warningmentes):
  ```bash
  mkcert -install
  mkcert -cert-file infra/certs/app.test.pem \
         -key-file infra/certs/app.test-key.pem \
         app.test localhost 127.0.0.1 ::1
  ```
  Tanúsítványcsere után indítsd újra az `nginx-gateway`-t.

## 3) Gyors indítás (stack)

```bash
docker compose -f compose.devops.yml up -d
# Graylog input (ha az UI már él):
./scripts/graylog-bootstrap.sh
# Gyors ellenőrzés:
./scripts/demo.sh
```

## 4) Jenkins (CI/CD)

- Indítás: `docker compose -f compose.jenkins.yml up -d`
- Első jelszó: `docker exec -it fake-jenkins cat /var/jenkins_home/secrets/initialAdminPassword`
- Pluginok: NodeJS, Git, Pipeline (Docker/Compose már az image-ben).
- Tools: *Manage Jenkins → Tools* → NodeJS `node20`.
- Pipeline: forrás a repo, `ci/Jenkinsfile`.
- Fő lépések:
  1. Checkout + `SHORT_SHA`
  2. Frontend CI: `npm install`, `npm run lint --if-present`, `npm run build`
  3. Backend CI: `npm install`, `npm run build`
  4. Docker build: frontend, backend, nginx-gateway, prometheus, grafana
  5. Compose deploy: `.env.devops` biztosítva, `docker compose up -d --no-deps` a frissített service-ekre
  6. Post checks: health az API/nginx/Prometheus/Grafana felé; syslog teszt Graylogra
  7. Artifacts: `frontend/dist/**/*`, `backend/dist/**/*`
- Hálózat: a `compose.jenkins.yml` az `fake-twitter-devops_devops_net` external networköt használja (a fő compose hozza létre).

## 5) Szolgáltatás térkép, URL-ek, belépési adatok

| Komponens | URL/host | Default cred | Megjegyzés |
|-----------|----------|--------------|------------|
| UI | https://app.test | – | `/debug_ip` proxy-demó |
| API | https://app.test/api | – | Health: `/api/health`, metrics: `/metrics` |
| Nginx gateway | 80/443 | – | HTTP→HTTPS redirect, rate limit az `/api/`-n |
| Mongo Express | http://localhost:8081 | admin / admin | DB: `fake-twitter` |
| Prometheus | http://localhost:9090 | – | Scrape: backend `/metrics` |
| Grafana | http://localhost:3001 | admin / admin (`.env.devops`) | Dashboard: *Fake Twitter Overview* |
| Graylog UI | http://localhost:9000 | admin / admin (SHA2 az `.env.devops`-ból) | Syslog UDP: 5140 |
| Jenkins | http://localhost:8080 | wizard PW a secrets fájlban | Node tool: `node20` |

## 6) Scripts (`scripts/`)

- `demo.sh`: konténerlista, API health, `/debug_ip`, Prometheus targets, Grafana URL kiírás, Graylog teszt log.
- `graylog-bootstrap.sh`: REST hívással létrehozza a **Syslog UDP 5140** inputot (env vars: `GRAYLOG_URL`, `GRAYLOG_USER`, `GRAYLOG_PASSWORD`).

## 7) App fejlesztés (ha CI/CD nélkül akarod futtatni)

Backend:
```bash
cd backend
npm install
cp .env.example .env
npm run dev          # fejlesztés
npm run build && npm start   # prod mód dist-ből
```
Frontend:
```bash
cd frontend
npm install
npm start            # Angular dev szerver 4200-on
npm run build        # prod build
```

Seedelt belépési adatok (app):
- Admin: `admin@example.com` / `AdminPass123`
- User: `alice@example.com` / `Password123`
- User: `bob@example.com` / `Password123`
