# Smart Doctor — Frontend

React + Vite + Tailwind frontend matching the login/home wireframe.
The chatbot connects to `../code new/answer.py` on port `8000`. The Disease Recognizer connects to `../ai-doctor/answer.py` on port `8001`.
Set `VITE_API_URL` and `VITE_DISEASE_API_URL` in a `.env` file to use different API URLs.
The retailer and Medicine Finder REST API uses `VITE_REST_API_URL` (defaults to `http://localhost:3000`).

## Run it

```bash
npm install
npm run dev
```

## Structure

```
src/
├── App.jsx                              # routes + auth guard
├── main.jsx                             # entry point
├── index.css                            # tailwind + small custom styles
└── components/
    ├── Login/
    │   └── LoginPage.jsx                 # sign in / sign up tabs
    ├── Home/
    │   └── HomePage.jsx                  # navbar shell + routed content + floating About button
    ├── Chatbot/
    │   ├── ChatbotPage.jsx               # symptom chat, currently backed by a mock responder
    │   ├── ChatBubble.jsx
    │   ├── ChatInput.jsx
    │   └── SymptomMatchResults.jsx       # inline symptom-match % cards
    ├── Diseases/
    │   ├── DiseasesPage.jsx              # searchable disease list
    │   └── DiseaseDetailPage.jsx         # accordion disease detail page
    ├── MedicineFinder/
    │   └── MedicineFinderPage.jsx        # search, cart, pharmacy results
    ├── About/
    │   └── AboutPage.jsx
    └── Navbar/
        └── Navbar.jsx                    # Chatbot / Diseases / Medicine Finder tabs
```

Every page component lives in its own folder under `components/`, alongside any sub-components it owns (e.g. `Chatbot/` holds `ChatbotPage.jsx` plus the bubble, input, and results components it uses).

## Run the API

Start the Express/MongoDB service and both FastAPI services in separate terminals from the repository root:

```bash
cd backend
npm install
npm run dev
```

Configure `backend/.env` first; see [the backend README](../backend/README.md). The retailer API requires a running MongoDB instance or Atlas URI.

```bash
cd "code new"
python answer.py
```

```bash
cd ai-doctor
python answer.py
```

The chat API listens on `http://localhost:8000`; the AI Doctor API listens on `http://localhost:8001`.
Both allow the Vite development origin by default. Set `FRONTEND_ORIGINS` to a comma-separated list when hosting the frontend elsewhere.

Connected endpoints:

- `POST /chat` accepts `{ "message": "...", "history": [] }` and returns `{ "reply": "..." }`.
- `POST /disease-recognizer` accepts a JPEG in the multipart `image` field and an optional audio file in `audio`. It returns the transcript, analysis, generated audio, and a medical disclaimer. Each upload must be 10 MB or smaller.

Other backend workflows still use mock data:

- `DiseasesPage.jsx` → `MOCK_DISEASES` → `GET /api/diseases`
- `DiseaseDetailPage.jsx` → `MOCK_DETAIL` → `GET /api/diseases/:id`
- `MedicineFinderPage.jsx` → Express `GET /api/medicines`, `POST /api/medicine-search`
- `LoginPage.jsx` → Express `POST /api/auth/login`, `POST /api/auth/register`
- `InventoryPage.jsx` → Express retailer inventory endpoints

## Notes

- The Express API returns a JWT stored by the frontend in localStorage for this prototype. Use secure HttpOnly cookies and production token/session controls before public deployment.
- Disclaimer text ("symptom match, not a diagnosis") is intentionally kept in multiple places (chat, results card, disease page, about page) — don't remove these even under time pressure.
