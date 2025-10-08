# ChatApp - MERN Stack Chat Application

A real-time chat application built with the **MERN stack** (MongoDB, Express.js, React.js, Node.js), styled with **Tailwind CSS**, integrated with **Stream.io** for real-time messaging, and containerized using **Docker**. This app allows users to create accounts, add friends, and chat in real-time.

---

## Technologies Used

- **Frontend:** React.js, Tailwind CSS, Vite  
- **Backend:** Node.js, Express.js  
- **Database:** MongoDB  
- **Real-Time Messaging:** [Stream.io](https://getstream.io/)  
- **Containerization:** Docker, Docker Compose  
- **Version Control:** Git, GitHub  

---

## Features

- User registration and authentication  
- Add, accept, and manage friends  
- Real-time chat using Stream.io  
- Responsive and modern UI with Tailwind CSS  
- Fully containerized backend, frontend, and database  
- Easily deployable using Docker  

---

## ⚡ Project Structure
├─ backend/ # Node.js + Express API
├─ frontend/ # React.js + Tailwind frontend
├─ docker-compose.yml # Docker Compose for full stack
├─ README.md
└─ .env # Environment variables (backend)



1. Clone the Repository

bash
git clone https://github.com/<your-username>/ChatApp-FullStack.git
cd ChatApp-FullStack
2. Backend Setup
bash
Copy code
cd backend
npm install
cp .env.example .env    # configure environment variables
npm run dev             # start backend in dev mode


3. Frontend Setup
bash
Copy code
cd frontend
npm install
npm run dev             # start frontend dev server
Backend runs on http://localhost:5001
Frontend runs on http://localhost:5173

Docker Setup
This project is fully containerized with Docker. You can run the full stack with a single command.

1. Build and run with Docker Compose
bash
Copy code
docker-compose up --build

2. Access the app
Frontend: http://localhost:5173
Backend: http://localhost:5001
MongoDB: mongodb://localhost:27017

3. Push Docker images to Docker Hub (optional)
bash
Copy code
# Tag backend image
docker tag chatapp-backend ilyasdev88/chatapp-backend:latest
docker push ilyasdev88/chatapp-backend:latest

# Tag frontend image
docker tag chatapp-frontend ilyasdev88/chatapp-frontend:latest
docker push ilyasdev88/chatapp-frontend:latest

4. Pull and run (for collaborators)
bash
Copy code
docker pull ilyasdev88/chatapp-backend:latest
docker pull ilyasdev88/chatapp-frontend:latest
docker-compose up



Environment Variables
Create a .env file in the backend folder with the following:

env
Copy code
PORT=5001
MONGO_URL=mongodb://mongo:27017/chatapp
JWT_SECRET=your_jwt_secret
STREAM_API_KEY=your_stream_api_key
STREAM_API_SECRET=your_stream_api_secret


Production Build

Frontend: Build React app with npm run build (already handled in Dockerfile)
Backend: Runs in production mode with environment variables
Database: Persistent Docker volume

Useful Links

Stream.io Documentation
Tailwind CSS
Docker Documentation

