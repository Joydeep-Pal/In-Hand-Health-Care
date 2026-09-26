# Smart Doctor

Local development guide for the React frontend, Express/MongoDB API, and the two FastAPI services.

## Services

| Service | Folder | Port | Purpose |
| --- | --- | ---: | --- |
| React + Vite | `smart-doctor-frontend/` | 5173 | Web app |
| Express API | `backend/` | 3000 | Login, retailer inventory, medicine search |
| Chatbot API | `code new/` | 8000 | Symptom chat |
| AI Doctor API | `ai-doctor/` | 8001 | Image/audio analysis |
| Nearby Healthcare API | `location/server/` | 5000 | Nearby doctors, hospitals, and pharmacies |
| Nearby Healthcare UI | `location/client/` | 5174 | Nearby Healthcare map and results |
| MongoDB | Local or Atlas | 27017 by default locally | Express API database |

Run each application service in its own terminal and keep those terminals open. MongoDB is a separate database service, not another application command. The AI Doctor and Chatbot services both use the workspace-root `.env` for the OpenRouter key.

## First-Time Setup

### 1. Configure environment files

The workspace-root `.env` must contain `OPENROUTER_API_KEY` for the Python AI services. Keep its values private and do not put this key in a frontend environment file.

The Express API uses its own `backend/.env`, with `MONGODB_URI`, `JWT_SECRET`, and optionally `PORT` and `FRONTEND_ORIGIN`. If `backend/.env` does not exist, create it from the example:

```bash
cd backend
test -f .env || cp .env.example .env
```

Edit `backend/.env` and set a MongoDB connection string and a private `JWT_SECRET` of at least 32 characters. The backend README has additional configuration details.

The Nearby Healthcare API has a separate `location/server/.env`. If needed, create it from `location/server/.env.example` and configure `MONGO_URI`. Its Vite client proxies `/api` requests to port `5000`, so browser requests stay on the page's origin and do not depend on a changing LAN IP or CORS entry. The location server can use an Atlas URI from `backend/.env` when its own URI points at local MongoDB.

### 2. Install dependencies

Run these once from the workspace root:

```bash
npm --prefix backend install
npm --prefix smart-doctor-frontend install
npm --prefix location/server install
npm --prefix location/client install
python -m venv .venv
source .venv/Scripts/activate
python -m pip install -r ai-doctor/requirements.txt langchain-chroma
```

These Python packages support the AI Doctor API and the Chatbot API. To rebuild the Chatbot's knowledge index with `code new/ingest.py`, also install `langchain-community`, `langchain-text-splitters`, and `pypdf`.

If the Nearby Healthcare database has not been populated yet, import its bundled datasets once with `npm --prefix location/server run import`. The import command is not needed for each server start.

## Start Everything

Open one terminal for each service you want to run. Start each command from the workspace root:

**Terminal 1: Express API**

```bash
cd backend
npm run dev
```

**Terminal 2: Chatbot API**

```bash
source .venv/Scripts/activate
cd "code new"
python answer.py
```

**Terminal 3: AI Doctor API**

```bash
source .venv/Scripts/activate
cd ai-doctor
python answer.py
```

**Terminal 4: React frontend**

```bash
cd smart-doctor-frontend
npm run dev
```

**Terminal 5: Nearby Healthcare API**

```bash
cd location/server
npm run dev
```

**Terminal 6: Nearby Healthcare frontend**

```bash
cd location/client
npm run dev
```

Open <http://localhost:5173/> for the main app or <http://localhost:5174/nearby> for Nearby Healthcare. On a phone, use the Network URL printed by the location client's Vite server and add `/nearby`. Leave the terminals for the services you’re using open. The main frontend uses local API ports 3000, 8000, and 8001; Nearby Healthcare proxies API requests to port 5000.

## Verify Services

In another terminal, check the API health endpoints:

```bash
curl http://localhost:3000/api/health
curl http://localhost:8000/
curl http://localhost:8001/
curl http://localhost:5000/api/health
```

The Express health response should show `"database":"connected"`. The frontend should load at `http://localhost:5173/`.

## Troubleshooting

- If a port is already in use, check for an existing server before starting another copy. Stop a server with `Ctrl+C` in its terminal.
- If Express exits with a MongoDB connection error, start MongoDB or correct `MONGODB_URI` in `backend/.env`.
- If either FastAPI service reports a missing OpenRouter key, check the workspace-root `.env`; do not paste the key into source code or the frontend.
- Run the Python activation command from the workspace root in Git Bash. In PowerShell, activate with `.venv\Scripts\Activate.ps1` instead.
