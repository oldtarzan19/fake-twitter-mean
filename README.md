# Fake Twitter MEAN Demo

Minimal Twitter-szerű demóalkalmazás **MongoDB + Express + Angular + Node.js (MEAN)** stackkel, teljesen TypeScript alapon. A rendszer session-cookie autentikációt, RBAC jogosultságokat és alap közösségi funkciókat biztosít: tweetelés, kommentelés, like, retweet, követés, admin moderáció.

## Követelmények

- Node.js 18+ és npm
- Docker + Docker Compose (lokális MongoDB indításához)
- MongoDB elérhető a `mongodb://localhost:27017/fake_twitter` címen

## Projektszerkezet

```
backend/   # Express + Mongo + session alapú REST API (TypeScript)
frontend/  # Angular 17+ standalone alkalmazás (TypeScript)
```

## Backend (Express + Mongo)

```bash
cd backend
npm install
cp .env.example .env
npm run build     # TypeScript fordítás (dist/)
npm start         # Node.js futtatás (dist/index.js)
```

Fejlesztéshez hot-reload:

```bash
npm run dev
```

### Környezeti változók

A backend alapértelmezett értékekkel indul, de az alábbi ENV változókkal testre szabható:

| Változó        | Alapértelmezett érték                      | Leírás                     |
| -------------- | ------------------------------------------ | --------------------------- |
| `PORT`         | `3000`                                     | Express szerver port        |
| `MONGODB_URI`  | `mongodb://localhost:27017/fake_twitter`   | MongoDB connection string   |
| `SESSION_SECRET` | `dev_secret_change_me`                  | Session aláírási kulcs      |
| `CORS_ORIGINS` | `http://localhost:4200`                    | Engedélyezett frontend URL  |

### Seed adatok

A script törli az adatbázist, majd létrehoz:
- 1 admin felhasználót (`admin@example.com / AdminPass123`)
- 2 felhasználót (`alice@example.com`, `bob@example.com`)
- Tweeteket, kommenteket, like-okat, retweeteket, követéseket

Futtatás:

```bash
npm run seed
```

## Frontend (Angular)

```bash
cd frontend
npm install
npm start
```

Az Angular fejlesztői szerver a `http://localhost:4200` címen érhető el, és a backend API-hoz (`http://localhost:3000/api`) küld session-cookie-val ellátott kéréseket.

### Fontos Angular funkciók

- **Guardok:** `authGuard`, `adminGuard`, `guestGuard`
- **Szolgáltatások:** `AuthService`, `TweetService`, `UserService`, `AdminService`
- **Oldalak:** belépés/regisztráció, hírfolyam, tweet részletek, profil, admin dashboard
- **Komponensek:** tweet-kártya, tweet-szerkesztő, komment lista

## Fő funkciók

### Felhasználói szerepkörök
- **user:** regisztráció, bejelentkezés, tweet/komment/like/retweet, követés
- **admin:** felhasználók felfüggesztése/aktiválása/törlése, tweetek & kommentek törlése

### Auth & RBAC
- Session cookie (`fake_twitter.sid`) httpOnly + SameSite=Lax (Secure=false fejlesztéskor)
- Middleware-ek: `requireAuth`, `requireActiveUser`, `requireAdmin`
- Felfüggesztett user nem írhat (tweet, komment, like, retweet, follow)

### REST API végpontok (részlet)

| Végpont | Módszer | Leírás |
| ------- | ------- | ------ |
| `/api/auth/register` | POST | Regisztráció + automatikus beléptetés |
| `/api/auth/login` | POST | Bejelentkezés |
| `/api/auth/logout` | POST | Kilépés |
| `/api/auth/me` | GET | Aktív session adatai |
| `/api/tweets` | GET | Tweet lista (`?scope=global|following|user&userId=...`, `limit`, `skip`) |
| `/api/tweets` | POST | Új tweet (aktív user szükséges) |
| `/api/tweets/:id` | GET/DELETE | Tweet részletei / törlés (tulaj/admin) |
| `/api/tweets/:id/like` | POST/DELETE | Like / unlike |
| `/api/tweets/:id/retweet` | POST/DELETE | Retweet / visszavonás |
| `/api/tweets/:id/comments` | GET/POST | Komment lista / új komment |
| `/api/tweets/comments/:commentId` | DELETE | Komment törlése (szerző/tweet szerző/admin) |
| `/api/users/:id` | GET | Felhasználói profil + statisztika + kapcsolat jelzők |
| `/api/users/:id/follow` | POST/DELETE | Követés / leállítás |
| `/api/users/:id/followers|following` | GET | Követők / követések listája |
| `/api/admin/users` | GET | Felhasználók listája (keresés + lapozás) |
| `/api/admin/users/:id/suspension` | PATCH | Felfüggesztés/aktiválás |
| `/api/admin/users/:id` | DELETE | Felhasználó törlése |

Minden hiba `{ "error": { "message": "...", "details"?: ... } }` formátumban érkezik.

## Frontend képernyők

- **Belépés / Regisztráció:** űrlapok validációval, hibaüzenetekkel
- **Hírfolyam:** globális/követett szűrő, tweet komponáló, like/retweet, lapozás
- **Tweet részletei:** kommentek listája, új komment, törlés jogosultság szerint
- **Profil:** tweetek, követők/követések tabok, követés gomb, saját profilnál tweet komponáló
- **Admin Dashboard:** kereshető user lista, felfüggesztés/aktiválás, törlés

## Hasznos parancsok összefoglalva

Backend:

```bash
npm run dev    # Fejlesztői mód
npm run build  # Transzpiláció (dist/)
npm start      # Production mód (dist-ből)
npm run seed   # Adatbázis feltöltése
```

Frontend:

```bash
npm start      # Angular dev szerver
npm run build  # Production build
```

## Hibakeresés

- **Mongo kapcsolat hiba:** ellenőrizd, hogy fut-e a Docker konténer és elérhető-e a `MONGODB_URI`.
- **Session cookie hiányzik:** a frontend minden HTTP kérésnél `withCredentials: true` beállítással dolgozik; győződj meg róla, hogy a backend `CORS_ORIGINS` tartalmazza a frontend URL-jét.
- **Angular build hiba WSL alatt:** töröld a `node_modules` mappát és futtasd az `npm install`-t azon a platformon, ahol a buildet végzed (esbuild natív bináris).

## DevOps pipeline & bemutató környezet

A teljes Jenkins → Docker Compose → Nginx → Prometheus/Grafana → Graylog lánc lépéseit a `docs/devops.md` fájl tartalmazza.

**Gyors indítás:**
```bash
cp .env.devops.example .env.devops
# Szerkeszd az .env.devops-t, állítsd be az OPENSEARCH_INITIAL_ADMIN_PASSWORD-öt
echo "127.0.0.1 app.test" | sudo tee -a /etc/hosts  # Windows: C:\Windows\System32\drivers\etc\hosts
docker compose -f compose.devops.yml up -d
```

A repository tartalmaz **production-ready self-signed TLS tanúsítványokat** (SAN-okkal: app.test, localhost, 127.0.0.1, ::1), így minden azonnal működik. A böngésző biztonsági figyelmeztetést fog mutatni, ami **normális és elfogadható** helyi fejlesztéshez és egyetemi bemutatóhoz.

**Opcionálisan**: Az mkcert használatával megbízható tanúsítványokat generálhatsz (részletek a `docs/devops.md`-ben). Az egyetemi értékelés szempontjából mindkét megközelítés érvényes.

Jenkins a `ci/Jenkinsfile`-t használja a pipeline-hoz.

## Bejelentkezési adatok (seed után)

| Szerep | E-mail | Jelszó |
| ------ | ------ | ------ |
| Admin | `admin@example.com` | `AdminPass123` |
| User  | `alice@example.com` | `Password123` |
| User  | `bob@example.com`   | `Password123` |

---

További fejlesztési ötletek: CI/CD pipeline.
