# Fake Twitter - DevOps Pipeline Demo

Teljes körű CI/CD pipeline bemutatásra, lokálisan futtatható Docker alapú infrastruktúrával.
A projekt egy MEAN stack (MongoDB, Express, Angular, Node.js) Twitter-klón alkalmazás, kiegészítve 6 DevOps eszközzel.

## Áttekintés

Ez a projekt demonstrálja a modern szoftverfejlesztési folyamat teljes életciklusát:
- **Continuous Integration**: automatikus build és tesztelés Jenkins-szel
- **Continuous Deployment**: automatikus telepítés Docker Compose-zal
- **API Gateway**: biztonságos hozzáférés Nginx reverse proxy-val (HTTPS, rate limiting)
- **Monitoring**: teljesítmény figyelés Prometheus és Grafana segítségével
- **Logging**: központosított naplózás Graylog-gal

### DevOps eszközök (6 db)

1. **Jenkins** - CI/CD pipeline orchestration
2. **Nginx** - Reverse proxy, API gateway, rate limiting, SSL/TLS terminálás
3. **mkcert** - Lokális fejlesztői TLS tanúsítványok
4. **Prometheus** - Metrics gyűjtés és tárolás
5. **Grafana** - Vizuális monitoring dashboard
6. **Graylog** - Központi log management és elemzés

---

## Gyors indítás

### 1. Előfeltételek

- **Docker Desktop** vagy Docker Engine + Compose plugin
- Szabad portok: `80, 443, 3001, 8080, 8081, 9000, 9090, 27017`

### 2. Hosts fájl beállítása

Az alkalmazás az `app.test` domain alatt érhető el. Adj hozzá egy bejegyzést a hosts fájlodhoz:

**Windows:**
```
C:\Windows\System32\drivers\etc\hosts
```

**Linux/macOS:**
```
/etc/hosts
```

Új sor:
```
127.0.0.1    app.test
```

### 3. Környezeti változók

Másold le a példa env fájlt:

```bash
cp .env.devops.example .env.devops
```

Az alapértelmezett jelszavak működnek a demóhoz, de módosíthatod őket ha szeretnéd.

### 4. Infrastruktúra indítása

```bash
# Fő stack indítása (backend, frontend, nginx, monitoring, logging)
docker compose -f compose.devops.yml up -d

# Várj 30 másodpercet amíg minden elindul, majd:

# Graylog log input automatikus létrehozása
bash scripts/graylog-bootstrap.sh

# Gyors ellenőrzés hogy minden működik
bash scripts/demo.sh
```

### 5. Jenkins CI/CD indítása

```bash
# Jenkins konténer indítása
docker compose -f compose.jenkins.yml up -d

# Kezdeti admin jelszó lekérése
docker exec fake-jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

Nyisd meg: **http://localhost:8080**

**Jenkins beállítás:**
1. Illeszd be a kezdeti jelszót
2. Válaszd: "Install suggested plugins"
3. Hozz létre egy admin usert
4. **Manage Jenkins → Tools → NodeJS installations**
   - Name: `node20`
   - Install automatically: Node 20.x
5. **New Item → Pipeline**
   - Definition: "Pipeline script from SCM"
   - SCM: Git
   - Repository URL: (a projekt helyi elérési útja vagy Git URL)
   - Script Path: `ci/Jenkinsfile`
6. Kattints **"Build Now"**

---

## Elérési pontok

Miután minden elindult, az alábbi szolgáltatások érhetők el:

| Szolgáltatás | URL | Belépés | Leírás |
|--------------|-----|---------|--------|
| **Alkalmazás UI** | https://app.test | - | A Twitter klón főoldala |
| **API** | https://app.test/api | - | REST API (health: `/api/health`) |
| **Jenkins** | http://localhost:8080 | wizard setup | CI/CD pipeline |
| **Grafana** | http://localhost:3001 | admin / admin | Monitoring dashboard |
| **Prometheus** | http://localhost:9090 | - | Metrics böngésző |
| **Graylog** | http://localhost:9000 | admin / admin | Log központ |
| **Mongo Express** | http://localhost:8081 | admin / admin | MongoDB admin UI |

### Teszt felhasználók az alkalmazásban

- Admin: `admin@example.com` / `AdminPass123`
- User 1: `alice@example.com` / `Password123`
- User 2: `bob@example.com` / `Password123`

---

## Működés bemutatása

### 1. CI/CD Pipeline (Jenkins)

A Jenkins pipeline automatikusan:
1. Letölti a legfrissebb kódot (checkout)
2. Felépíti a frontend-et (npm install → lint → build)
3. Felépíti a backend-et (npm install → build)
4. Docker image-eket készít
5. Telepíti a frissített verziókat Docker Compose-zal
6. Health check-eket futtat minden szolgáltatásra
7. Archíválja a build artifacts-eket

**Console Output**: minden lépés látható részletes logokkal.

### 2. Nginx API Gateway

Az Nginx három fő funkciót lát el:

**a) HTTPS redirect:**
- `http://app.test` → automatikusan átirányít → `https://app.test`
- Böngészőben kattints a lakat ikonra: láthatod a TLS tanúsítványt

**b) Reverse proxy:**
- Frontend: `https://app.test/` → `http://frontend:80`
- Backend API: `https://app.test/api/` → `http://backend:3000/api/`
- Speciális endpoint: `https://app.test/debug_ip` → visszaadja a gateway IP-jét

**c) Rate limiting:**
Az `/api/` route-on 30 kérés/perc limit van, 15-ös burst-tel.

### 3. Monitoring (Prometheus + Grafana)

**Prometheus:**
- Targets: http://localhost:9090/targets
- A backend `/metrics` endpoint-ját scrape-eli 10 másodpercenként
- State: **UP** (zöld)

**Grafana:**
- Dashboard: http://localhost:3001/d/fake-twitter-overview
- Automatikusan provisionált Prometheus datasource
- Metriks: HTTP kérések/sec, response time, memory használat

Forgalom generálása teszteléshez:
```bash
# Windows CMD
for /L %i in (1,1,50) do @curl -sk --resolve app.test:443:127.0.0.1 https://app.test/api/health
```

### 4. Logging (Graylog)

A backend konténer Docker syslog driverrel automatikusan továbbítja a logokat.

**Graylog UI:** http://localhost:9000
- **Search** → keress rá: `source:fake-twitter-backend`
- Láthatóak: HTTP kérések, DB műveletek, hibák

**Teszt log küldése:**
```bash
echo "<14>1 $(date -u +"%Y-%m-%dT%H:%M:%S.000Z") test fake-twitter - - - Test log" | nc -u 127.0.0.1 5140
```

---

## TLS / HTTPS tanúsítványok

A projekt tartalmaz egy **self-signed** (önaláírt) TLS tanúsítványt, ami azonnal működik, de a böngésző figyelmeztetést fog mutatni.

### Opció 1: Self-signed használata (alapértelmezett)

Nincs teendő, a tanúsítványok az `infra/certs/` mappában már benne vannak.

A böngészőben megjelenik egy figyelmeztetés → kattints **"Advanced"** → **"Proceed to app.test"**.

### Opció 2: Megbízható tanúsítvány (mkcert)

Ha nem szeretnéd a figyelmeztetést:

```bash
# Telepítsd az mkcert-et: https://github.com/FiloSottile/mkcert

# Installálás (csak egyszer)
mkcert -install

# Tanúsítvány generálása
mkcert -cert-file infra/certs/app.test.pem \
       -key-file infra/certs/app.test-key.pem \
       app.test localhost 127.0.0.1 ::1

# Nginx újraindítása (ha nem működik akkor rebuild)
docker compose -f compose.devops.yml restart nginx-gateway
```

Most a böngésző **megbízható** zöld lakat ikont fog mutatni.

---



## Leállítás

```bash
# Csak leállítás (adatok megmaradnak)
docker compose -f compose.devops.yml stop
docker compose -f compose.jenkins.yml stop

# Teljes törlés (adatokkal együtt)
docker compose -f compose.devops.yml down -v
docker compose -f compose.jenkins.yml down -v
```

---

## Projekt struktúra

```
.
├── backend/              # Node.js/Express API
├── frontend/             # Angular alkalmazás
├── infra/                # Infrastruktúra konfigurációk
│   ├── nginx/            # Nginx konfig és Dockerfile
│   ├── prometheus/       # Prometheus konfig
│   ├── grafana/          # Grafana dashboardok és datasources
│   └── certs/            # TLS tanúsítványok
├── ci/
│   └── Jenkinsfile       # CI/CD pipeline definíció
├── scripts/              # Segédscriptek (demo.sh, graylog-bootstrap.sh)
├── compose.devops.yml    # Fő stack (app + monitoring + logging)
└── compose.jenkins.yml   # Jenkins CI/CD
```

---

## Technológiai stack

**Alkalmazás:**
- MongoDB 7.0
- Express.js
- Angular 19
- Node.js 20

**DevOps:**
- Docker & Docker Compose
- Jenkins 2.x (CI/CD)
- Nginx (reverse proxy, API gateway)
- Prometheus (metrics)
- Grafana (dashboards)
- Graylog 6.0 (logging)
- OpenSearch 1.3 (Graylog backend)
