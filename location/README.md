# Smart Doctor — Nearby Healthcare Finder

Find nearby doctors, hospitals, and pharmacies in Asansol & surrounding areas using your real-time location.

## Tech Stack

- **Frontend**: React + Vite + React-Leaflet + OpenStreetMap
- **Backend**: Node.js + Express + MongoDB + Mongoose
- **Maps**: Leaflet + OpenStreetMap (no Google Maps API needed)

## Quick Start

### 1. Prerequisites

- Node.js v18+
- MongoDB running locally (or MongoDB Atlas)

### 2. Import the Dataset

```bash
cd server
npm install
cp .env.example .env
# Set MONGO_URI in .env to your MongoDB connection
npm run import
```

This reads all JSON files from `datasets/`, deduplicates records using `placeId`, converts coordinates to GeoJSON, and inserts into MongoDB.

### 3. Start the Backend

```bash
cd server
npm run dev
```

Server runs on `http://localhost:5000`

### 4. Start the Frontend

```bash
cd client
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

### 5. Use the App

1. Open `http://localhost:5173/nearby`
2. Click **Use My Current Location** or enter a location manually
3. Browse nearby doctors, hospitals, and pharmacies on the map
4. Filter by category (Doctors / Hospitals / Pharmacies)
5. Filter doctors by specialty (Cardiologist, Dermatologist, etc.)
6. Adjust search radius (1km - 20km)
7. Click **View Details** for full information
8. Click **Get Directions** to navigate via OpenStreetMap

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/nearby/doctors?lat=&lng=&radius=&specialty=` | Nearby doctors |
| GET | `/api/nearby/hospitals?lat=&lng=&radius=` | Nearby hospitals |
| GET | `/api/nearby/medical-shops?lat=&lng=&radius=` | Nearby pharmacies |
| GET | `/api/nearby/all?lat=&lng=&radius=&specialty=` | All nearby healthcare |

## Project Structure

```
smart-doctor/
├── client/          # React + Vite frontend
├── server/          # Express + MongoDB backend
├── datasets/        # Healthcare JSON data files
└── README.md
```
