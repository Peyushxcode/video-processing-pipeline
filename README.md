# 🚀 Media Processing Pipeline (Video Service)

A scalable, asynchronous **media processing pipeline** built using Node.js that handles heavy image and video transformations using background job queues.

This repository focuses on the **video processing service**, while also being part of a larger system that includes image processing.

---

## 🔗 Related Component

👉 Image Processing Service: https://github.com/Peyushxcode/image-processing-pipeline

---

## 🧠 Overview

This system is designed to offload CPU-intensive tasks like image compression and video transcoding from the main application thread using **Redis-based job queues (BullMQ)**.

It ensures:
- Non-blocking API responses  
- Scalable background processing  
- Efficient handling of large media files  

---

## ⚙️ Tech Stack

- Node.js  
- Redis  
- BullMQ (Job Queue)  
- FFmpeg (Video Processing)  
- Sharp (Image Processing - separate service)  

---

## 🔄 System Architecture

1. User uploads media via API  
2. Server pushes job to BullMQ queue  
3. Redis manages job scheduling and state  
4. Worker processes job:
   - 🎥 Videos → FFmpeg (transcoding, compression, thumbnails)  
   - 🖼️ Images → Sharp (via image service)  
5. Processed media is stored or returned  

---

## 🧩 Key Features

- ⚡ Asynchronous background processing using BullMQ  
- 🔁 Retry mechanisms for failed jobs  
- 🧵 Worker-based architecture for scalability  
- 🎥 Video transcoding and compression using FFmpeg  
- 🖼️ Image optimization via Sharp (separate service)  
- 🚀 Non-blocking, high-performance backend design  

---

## 📂 Project Structure

    .
    ├── src/
    │   ├── config/        # Configuration files (Redis, environment setup)
    │   ├── controllers/   # Request handlers / business logic
    │   ├── models/        # Data models (if used)
    │   ├── queue/         # BullMQ queue configuration
    │   ├── routes/        # API route definitions
    │   ├── utils/         # Helper functions
    │   ├── workers/       # Background workers (video processing with FFmpeg)
    │   └── server.js      # Application entry point
    │
    ├── .gitignore
    ├── package.json
    └── package-lock.json

---

## ▶️ Getting Started

### 1. Clone the repository

git clone https://github.com/Peyushxcode/video-processing-pipeline.git 
cd video-processing-pipeline

### 2. Install dependencies

npm install  

### 3. Setup environment variables

Create a `.env` file:

PORT=
MONGO_URI=
REDIS_HOST=localhost  
REDIS_PORT=6379  

### 4. Start Redis server

Make sure Redis is running locally or use a cloud instance.

### 5. Run the application

node server.js  

---

## 🧪 Example Workflow

- Upload a video file via API  
- Job is added to queue  
- Worker processes video using FFmpeg 
- Implement job progress tracking 
- Output file is generated (compressed/transcoded)  

---

## 📈 Future Improvements

- Add cloud storage (AWS S3 / Cloudinary)    
- Add streaming support for large files  
- Introduce microservices separation  

---

## 💡 Key Learnings

- Designing scalable backend systems using queues  
- Handling CPU-intensive tasks asynchronously  
- Working with Redis and BullMQ  
- Media processing using FFmpeg and Sharp  
- Building event-driven architectures  

---

## 📌 Note

This project is part of a **Media Processing Pipeline system** where image and video processing are handled as separate services for better scalability and modularity.

---

## 👨‍💻 Author

Peyush Sharma