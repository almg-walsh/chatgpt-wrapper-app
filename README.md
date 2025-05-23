
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



## Step 1: Deploy Backend on Render

1. **Create a Dockerfile** in your backend directory:
   ```dockerfile
   FROM golang:1.19-alpine
   WORKDIR /app
   COPY go.* ./
   RUN go mod download
   COPY . .
   RUN go build -o server .
   EXPOSE 8080
   CMD ["./server"]
   ```

2. **Push your code to GitHub**

3. **Sign up for Render** at [render.com](https://render.com)

4. **Create a Web Service**:
   - Connect your GitHub repo
   - Select "Docker" as the runtime
   - Give it a name like "chatgpt-wrapper-api"
   - Leave the build command empty (Dockerfile will be used)
   - Add environment variable `OPENAI_API_KEY`
   - Enable "Auto-Deploy" option

5. **Update CORS in your backend**:
   ```go
   // Add GitHub Pages domain to CORS
   w.Header().Set("Access-Control-Allow-Origin", "https://yourusername.github.io")
   // Or allow all origins for testing
   // w.Header().Set("Access-Control-Allow-Origin", "*")
   w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
   w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
   ```

## Step 2: Deploy Frontend on GitHub Pages

1. **Update API_URL in Chat.tsx**:
   ```tsx
   // filepath: /Users/aidan/Documents/projects/chatgpt-wrapper-app/frontend/src/Chat.tsx
   // Replace this:
   const API_URL = "http://localhost:8080/chat";
   
   // With your Render URL:
   const API_URL = "https://your-render-app-name.onrender.com/chat";
   ```

2. **Add homepage field to package.json**:
   ```json
   {
     "name": "chatgpt-wrapper-app",
     "version": "0.1.0",
     "homepage": "https://yourusername.github.io/chatgpt-wrapper-app",
     // Other fields...
   }
   ```

3. **Install gh-pages package**:
   ```bash
   cd frontend
   npm install --save-dev gh-pages
   ```

4. **Add deploy scripts to package.json**:
   ```json
   "scripts": {
     // Other scripts...
     "predeploy": "npm run build",
     "deploy": "gh-pages -d build"
   }
   ```

5. **Deploy to GitHub Pages**:
   ```bash
   npm run deploy
   ```

6. **Enable GitHub Pages** in your repo settings:
   - Go to Settings > Pages
   - Select "gh-pages" branch and "/root" directory 
   - Click "Save"

## Best Practices

1. **Environment Variables**: For production, use environment variables to configure API endpoints.
   ```tsx
   const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8080/chat";
   ```

2. **Handle Base Path**: GitHub Pages serves from a subdirectory, so consider:
   ```jsx
   import { BrowserRouter as Router, Routes } from 'react-router-dom';
   
   // Use basename for GitHub Pages
   <Router basename="/chatgpt-wrapper-app">
     <Routes>
       {/* Your routes */}
     </Routes>
   </Router>
   ```

3. **Optimize Image Handling**: 
   - Consider compressing base64 images before sending
   - Set a reasonable max size for uploaded images (to avoid API limits)

Both services are completely free, making this an excellent zero-cost deployment option!

Similar code found with 1 license type

almg-walsh: amazing, can you send this info to my email addrss or somewhere I can reference to it later?
