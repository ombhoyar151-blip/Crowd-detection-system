# CrowdSense — AI Crowd Detection System

A full-stack, production-ready crowd detection and analytics platform powered by **YOLOv8**. Detect and count people in images, videos, and live webcam feeds, classify crowd density, and export analytics reports.

![Tech Stack](https://img.shields.io/badge/Stack-React%20%2B%20FastAPI%20%2B%20YOLOv8-blue)

## Features

- **Three detection modes** — image upload, video upload, and live webcam
- **Real-time person counting** using YOLOv8 object detection
- **Crowd density classification** — Low / Medium / High
- **Confidence scores & processing time** for every detection
- **Analytics dashboard** with line, bar, and donut charts
- **Detection history** with filtering, search, and detail views
- **PDF & CSV reports** with summary statistics and record tables
- **JWT authentication** — login & signup with secure password hashing
- **SQLite database** for users and detection records
- **Dark mode** with persistent preference
- **Fully responsive** UI from mobile to desktop
- **Swagger API docs** at `/docs`
- **Docker support** — single-command deployment

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Python, FastAPI, Uvicorn |
| AI / Detection | YOLOv8 (ultralytics), OpenCV |
| Database | SQLite |
| Auth | JWT (PyJWT), bcrypt (passlib) |
| Reports | ReportLab (PDF), csv module (CSV) |
| Containerization | Docker, Docker Compose |

## Project Structure

```
crowdsense/
├── src/                          # Frontend (React + TypeScript)
│   ├── components/               # UI components, charts, layout
│   ├── contexts/                 # Auth & Theme providers
│   ├── lib/                      # API client, config, utilities
│   ├── pages/                    # Dashboard, Image, Video, Webcam, History, Reports, Login
│   ├── types/                    # Shared TypeScript types
│   ├── App.tsx                   # Root app with routing
│   ├── main.tsx                  # Entry point
│   └── index.css                 # Tailwind + global styles
├── backend/                      # Backend (Python FastAPI)
│   ├── app/
│   │   ├── routes/               # Auth, detection, history, dashboard, reports, files
│   │   ├── auth.py               # Password hashing & JWT
│   │   ├── config.py             # Settings
│   │   ├── database.py           # SQLite initialization
│   │   ├── dependencies.py       # Auth dependency
│   │   ├── detection.py          # YOLOv8 logic
│   │   ├── schemas.py            # Pydantic models
│   │   └── main.py               # FastAPI app factory
│   ├── requirements.txt
│   └── .env.example
├── Dockerfile                    # Full-stack container
├── Dockerfile.frontend           # Frontend-only container
├── docker-compose.yml
├── nginx.conf                    # Reverse proxy config
├── .env.example
└── README.md
```

## Getting Started

### Option 1: Demo Mode (Frontend Only)

The frontend runs in **demo mode** without a backend — it uses simulated detection results and localStorage for history. This is great for exploring the UI.

```bash
npm install
npm run dev
```

Open the app and sign in with any email and password (6+ characters). All features work with simulated data.

### Option 2: Full Stack (Frontend + Backend)

#### Prerequisites

- Node.js 18+
- Python 3.10+
- A webcam (for live detection)

#### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # Edit settings as needed
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend downloads the YOLOv8 model automatically on first run. Swagger docs are available at `http://localhost:8000/docs`.

#### Frontend Setup

```bash
# From project root
cp .env.example .env
# Set VITE_API_BASE_URL=http://localhost:8000 in .env
npm install
npm run dev
```

Open the URL shown in the terminal. Sign up for an account, then upload images or video, or use your webcam for live detection.

### Option 3: Docker

#### Full Stack with Docker Compose

```bash
docker compose up --build
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- API Docs: `http://localhost:8000/docs`

#### Single Container (Full Stack)

```bash
docker build -t crowdsense .
docker run -p 8000:8000 -v crowdsense-data:/app/data crowdsense
```

The app is served at `http://localhost:8000` with the API and static frontend combined.

## API Documentation

Once the backend is running, visit:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create a new account |
| POST | `/api/auth/login` | Sign in and receive JWT |
| POST | `/api/detect/image` | Detect people in an image |
| POST | `/api/detect/video` | Detect people in a video |
| GET | `/api/history` | List detection history |
| DELETE | `/api/history/{id}` | Delete a detection record |
| GET | `/api/dashboard` | Get aggregated analytics |
| GET | `/api/reports/csv` | Download CSV report |
| GET | `/api/reports/pdf` | Download PDF report |

## Configuration

### Frontend (`.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL. Empty = demo mode | _(empty)_ |

### Backend (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `SECRET_KEY` | JWT signing secret | `change-this-...` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token lifetime | `1440` |
| `CORS_ORIGINS` | Allowed CORS origins | `*` |
| `MODEL_NAME` | YOLOv8 model variant | `yolov8n.pt` |
| `LOW_THRESHOLD` | Max count for "Low" density | `5` |
| `MEDIUM_THRESHOLD` | Max count for "Medium" density | `20` |
| `CONFIDENCE_THRESHOLD` | Min detection confidence | `0.25` |

## Deployment

### Deploying to a Server

1. **Build the frontend**:
   ```bash
   npm run build
   ```
   This outputs static files to `dist/`.

2. **Deploy with Docker**:
   ```bash
   docker compose up -d --build
   ```

3. **Or deploy manually**:
   - Serve `dist/` with any static host (Nginx, Vercel, Netlify, etc.)
   - Run the FastAPI backend behind a reverse proxy (Nginx, Caddy)
   - Set `VITE_API_BASE_URL` to your backend's public URL

### Environment Variables for Production

- Change `SECRET_KEY` to a strong random value
- Set `CORS_ORIGINS` to your frontend domain
- Use a larger YOLOv8 model (`yolov8s.pt`, `yolov8m.pt`) for better accuracy if you have GPU resources

## Connecting to Your GitHub Repository

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: CrowdSense crowd detection system"

# Add your remote repository
git remote add origin https://github.com/YOUR_USERNAME/crowdsense.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## License

This project is provided as-is for educational and commercial use.
