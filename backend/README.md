# Smart Doctor REST API

Express REST API for customer and retailer accounts, MongoDB-backed pharmacy inventory, and medicine availability search.

## Requirements

- Node.js 20 or newer
- MongoDB running locally, or a MongoDB Atlas connection string

## Configure and run

From this directory, copy `.env.example` to `.env` and set `MONGODB_URI` and a private `JWT_SECRET` of at least 32 characters. Keep `.env` out of source control.

```bash
npm install
npm run dev
```

The API defaults to `http://localhost:3000`. `GET /api/health` reports whether MongoDB is connected. Set `FRONTEND_ORIGIN` to the frontend origin; multiple comma-separated origins are accepted.

To add five sample retailer shops with stocked catalog medicines within a few hundred meters of `22.960297, 88.448256`, run:

```bash
npm run seed:retailers
```

The seed is insert-only and safe to rerun; existing accounts with the demo email addresses are left unchanged. It only connects to local MongoDB by default. For an explicitly chosen remote database, append `-- --allow-remote` to the command. Demo accounts receive random, undisclosed password hashes and are intended only for medicine-search sample data.

## Routes

- `POST /api/auth/register` creates a customer or retailer and returns a JWT.
- `POST /api/auth/login` authenticates an email, password, and selected role.
- `GET /api/medicines?query=...` returns catalog medicines and medicines listed by retailers.
- `POST /api/medicine-search` accepts `{ "medicines": [{ "medicineId": "...", "quantity": 1 }], "location": { "latitude": 0, "longitude": 0 } }`. Location is optional.
- `GET /api/retailers/me` returns the signed-in retailer profile and inventory.
- `PATCH /api/retailers/me/location` saves retailer coordinates for distance sorting.
- `POST /api/retailers/me/inventory` adds stock; repeated medicine IDs increase the existing quantity.
- `PATCH /api/retailers/me/inventory/:medicineId` sets a stock quantity.
- `DELETE /api/retailers/me/inventory/:medicineId` removes a medicine from that retailer's inventory.

Send retailer endpoints the returned token in `Authorization: Bearer <token>`. Retailer routes enforce the account role on the server.