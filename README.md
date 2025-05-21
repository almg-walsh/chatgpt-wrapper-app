
# ChatGPT Wrapper App

## 📦 Stack
- Backend: Go (with Gorilla Mux)
- Frontend: React + Vite + TypeScript
- Deployment: Docker Compose + GitHub Actions

## 🚀 Getting Started

1. Add your OpenAI key to `.env`:

```bash
cp backend/.env.example backend/.env
```

2. Build and run locally:

```bash
docker-compose up --build
```

3. Visit frontend at: [http://localhost:3000](http://localhost:3000)

## 🧠 Features

- ChatGPT (via OpenAI API)
- Session history in memory
- CORS configured
- Dockerized frontend/backend
- GitHub Actions for CI/CD

## 🔁 Deployment

Push to `master` triggers build and DockerHub push via GitHub Actions.
Set secrets in your GitHub repo:

- `DOCKER_USERNAME`
- `DOCKER_PASSWORD`
