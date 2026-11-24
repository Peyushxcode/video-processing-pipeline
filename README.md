# Media Processing Pipeline (Video Service)

A scalable, asynchronous video processing and streaming pipeline built with **Node.js, BullMQ, Redis, FFmpeg, MongoDB, and AWS S3**.

The system supports direct video uploads to cloud storage, background transcoding, multi-resolution HLS generation, adaptive video streaming, and processing progress tracking.

This repository focuses on the video processing service and is part of a larger media processing system.

---

## Related Component

**Image Processing Service:** https://github.com/Peyushxcode/image-processing-pipeline

---

## Overview

Video processing is computationally expensive and should not block the main application server.

This project separates video processing from HTTP request handling using **BullMQ and Redis**. The API handles upload registration, job creation, processing status, and video streaming, while independent workers perform CPU-intensive operations using FFmpeg.

Original and processed media files are stored in a private AWS S3 bucket.

The system supports:

- Direct-to-S3 video uploads using presigned URLs
- Asynchronous video processing using background workers
- Multi-resolution video transcoding
- HLS playlist and segment generation
- Adaptive bitrate streaming through HLS.js
- Secure storage of media objects in private S3
- Video streaming through an Express API
- Processing progress tracking using BullMQ
- Browser-based video playback with manual quality selection

---

## Tech Stack

| Technology | Purpose |
|---|---|
| Node.js | Backend runtime |
| Express.js | REST APIs and video streaming |
| Redis | Queue backend and job state management |
| BullMQ | Background job processing |
| MongoDB / Mongoose | Video metadata and processing status |
| FFmpeg | Video transcoding, thumbnail generation, and HLS packaging |
| AWS S3 | Original and processed media storage |
| AWS SDK for JavaScript | S3 operations and presigned URLs |
| HLS.js | Browser-based adaptive video streaming |
| Docker | Local infrastructure for Redis and MongoDB |

---

## System Architecture

```text
                         Client / Browser
                                |
                                |
                    Request Presigned Upload URL
                                |
                                v
                         Express API
                                |
                                v
                         AWS S3 Bucket
                         (Private Storage)
                                ^
                                |
                      Direct Video Upload
                                |
                         Client / Browser
                                |
                                |
                       Register Uploaded Video
                                |
                                v
                         Express API
                                |
                     MongoDB Video Record
                                |
                                v
                          BullMQ Queue
                                |
                              Redis
                                |
                                v
                        Video Worker
                                |
                                v
                       Download from S3
                                |
                                v
                      FFmpeg Processing
                                |
                  +-------------+-------------+
                  |             |             |
                360p          480p          720p
                  |             |             |
                  +-------------+-------------+
                                |
                                v
                       Generate HLS Files
                     (Playlists + Segments)
                                |
                                v
                       Upload Files to S3
                                |
                                v
                     Update MongoDB Status
                                |
                                v
                         Express API
                         (HLS Proxy)
                                |
                                v
                       HLS.js Video Player
```

The API server and processing worker run as separate processes, allowing HTTP request handling and CPU-intensive processing to operate independently.

---

## Key Features

### 1. Direct Video Upload to AWS S3

The backend generates a presigned S3 URL that allows clients to upload video files directly to cloud storage.

This avoids routing large video uploads through the Express server.

**Workflow:**

1. Client requests a presigned upload URL.
2. Backend generates a temporary S3 PUT URL.
3. Client uploads the original video directly to S3.
4. Client registers the uploaded S3 object with the backend.
5. Backend creates a video record and enqueues a processing job.

### 2. Asynchronous Processing with BullMQ

Video processing jobs are managed through BullMQ, backed by Redis.

The Express server enqueues processing jobs and returns a response without waiting for FFmpeg operations to finish.

Independent workers consume jobs and perform the processing.

This architecture supports separation of concerns and allows processing capacity to be increased by running additional workers, subject to available CPU and memory resources.

### 3. Multi-Resolution Video Transcoding

FFmpeg transcodes uploaded videos into three output resolutions:

| Quality | Resolution |
|---|---|
| 360p | 640 × 360 |
| 480p | 854 × 480 |
| 720p | 1280 × 720 |

Video is encoded using H.264, with AAC for audio.

Each resolution is generated independently before being packaged for HLS streaming.

The current implementation uses a fixed output ladder; source-resolution-aware variant selection can be added later.

### 4. HTTP Live Streaming (HLS)

The pipeline converts transcoded videos into HLS-compatible media playlists and transport stream segments.

Each quality contains its own playlist and video segments.

A master playlist references the available qualities.

Example output:

```text
processed/
    <videoId>/
        master.m3u8
        thumbnail.png

        360p/
            index.m3u8
            index0.ts
            index1.ts
            ...

        480p/
            index.m3u8
            index0.ts
            index1.ts
            ...

        720p/
            index.m3u8
            index0.ts
            index1.ts
            ...
```

This allows compatible video players to request media in segments instead of downloading the entire video before playback.

### 5. Adaptive Bitrate Streaming

The frontend uses HLS.js to play the generated HLS streams.

The player supports:

- Automatic quality selection based on HLS.js adaptive bitrate logic
- Manual switching between available video qualities
- Segment-based video loading
- Media buffering and playback through browser media APIs

The browser requests the master playlist, selects a suitable quality, and downloads the required media segments.

### 6. Private S3 Video Streaming

All media objects remain stored in a private AWS S3 bucket.

Instead of exposing public S3 object URLs, the Express backend provides an HLS streaming endpoint.

```http
GET /api/stream/:videoId/master.m3u8
```

Example segment request:

```http
GET /api/stream/:videoId/720p/index0.ts
```

The backend retrieves the requested object from S3 and streams it to the client.

Requested HLS paths are validated before accessing S3.

**Note:** The S3 bucket is private, but the current streaming API does not yet implement user-level authentication or authorization.

### 7. Video Processing Progress Tracking

The worker reports progress through BullMQ as it completes different processing stages.

Progress milestones include:

- Downloading the original video
- Generating the thumbnail
- Transcoding individual resolutions
- Generating HLS playlists and segments
- Uploading processed files to S3
- Completing processing

The backend exposes a status endpoint:

```http
GET /api/video/:videoId/status
```

Example response:

```json
{
  "videoId": "6920abc123456789abcdef01",
  "status": "processing",
  "jobState": "active",
  "progress": 55,
  "stage": "Transcoding 720p"
}
```

Progress values represent completed processing milestones rather than exact FFmpeg execution percentages.

The frontend currently uses HTTP polling to retrieve updates and display a processing progress bar.

Once processing completes, the frontend automatically initializes the HLS player.

---

## Project Structure

```text
.
├── public/
│   └── player.html
│
├── src/
│   ├── config/
│   │   ├── redis.js
│   │   └── ...
│   │
│   ├── controllers/
│   │   └── ...
│   │
│   ├── models/
│   │   └── Video.js
│   │
│   ├── queue/
│   │   └── ...
│   │
│   ├── routes/
│   │   └── ...
│   │
│   ├── utils/
│   │   ├── downloadFromS3.js
│   │   ├── uploadToS3.js
│   │   ├── uploadDirectoryToS3.js
│   │   ├── transcodeVideo.js
│   │   ├── generateHLS.js
│   │   ├── generateMasterPlaylist.js
│   │   └── ...
│   │
│   ├── workers/
│   │   └── videoWorker.js
│   │
│   └── server.js
│
├── temp/
├── .env
├── .gitignore
├── package.json
└── package-lock.json
```

The `temp/` directory stores intermediate files during processing and should be excluded from Git.

---

## Getting Started

### Prerequisites

Ensure the following are installed:

- Node.js and npm
- Docker or locally running Redis and MongoDB instances
- FFmpeg and FFprobe
- An AWS account with an S3 bucket and appropriate IAM permissions

### 1. Clone the Repository

```bash
git clone https://github.com/Peyushxcode/video-processing-pipeline.git
cd video-processing-pipeline
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root.

```env
PORT=5200

MONGO_URI=mongodb://localhost:27017/video-pipeline

REDIS_HOST=localhost
REDIS_PORT=6379

AWS_REGION=your-aws-region
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_BUCKET_NAME=your-bucket-name
```

Use the exact environment variable names expected by your local S3 configuration.

Never commit `.env` or AWS credentials to the repository.

### 4. Start Redis and MongoDB

If using Docker:

```bash
docker run -d --name video-redis -p 6379:6379 redis:7

docker run -d --name video-mongo -p 27017:27017 mongo:7
```

Alternatively, start your existing Redis and MongoDB containers.

### 5. Start the API Server

```bash
node src/server.js
```

The API runs on:

```text
http://localhost:5200
```

### 6. Start the Video Worker

Open another terminal:

```bash
node src/workers/videoWorker.js
```

The worker connects to Redis, consumes queued video jobs, and performs processing using FFmpeg.

---

## API Workflow

### 1. Generate a Presigned Upload URL

```http
POST /api/video/upload-url
```

The backend returns an S3 upload URL and an object key.

### 2. Upload Video Directly to S3

Upload the video using the presigned URL and an HTTP PUT request.

The original video is stored in the private S3 bucket.

### 3. Register the Uploaded Video

```http
POST /api/video/register
Content-Type: application/json
```

Request body:

```json
{
  "s3Key": "videos/example-video.mp4"
}
```

The backend creates a MongoDB document and adds a BullMQ processing job.

The response includes the video ID and job ID.

### 4. Check Processing Status

```http
GET /api/video/:videoId/status
```

The endpoint combines the video status stored in MongoDB with progress information from BullMQ.

Possible video statuses:

- `pending`
- `processing`
- `completed`
- `failed`

### 5. Stream the Processed Video

Once processing is complete:

```http
GET /api/stream/:videoId/master.m3u8
```

The HLS player loads the master playlist and requests media segments through the Express streaming API.

### 6. Open the Browser Player

```text
http://localhost:5200/player.html
```

Configure the video ID in the player to test playback, quality selection, and processing progress.

---

## Design Decisions

### Why BullMQ?

Video transcoding is CPU-intensive and can take significantly longer than ordinary HTTP requests.

BullMQ allows the API to enqueue work without waiting for processing to complete.

### Why Direct-to-S3 Uploads?

Uploading directly to S3 reduces bandwidth usage and upload-handling overhead on the application server.

The backend only generates temporary upload authorization and manages metadata.

### Why HLS Instead of Serving MP4 Files Directly?

HLS divides video into smaller segments and supports multiple quality variants.

This enables adaptive streaming, quality switching, and more flexible buffering behavior.

### Why Separate API and Worker Processes?

Separating the worker from the API prevents FFmpeg workloads from executing inside the HTTP request-handling process.

It also allows the API and processing workers to be scaled independently.

### Why Keep S3 Private?

Private S3 storage prevents direct anonymous access to original and processed media objects.

The application controls how those objects are exposed through its streaming API.

Application-level access control is planned as a future improvement.

---

## Future Improvements

- Replace HTTP polling with Server-Sent Events (SSE) and Redis Pub/Sub for real-time processing updates
- Add authentication and authorization for video access
- Introduce CloudFront CDN delivery for HLS media
- Add durable progress-event recovery and reconnection handling
- Implement source-aware transcoding profiles and bitrate ladders
- Improve HLS segment alignment across quality variants
- Add processing retries, idempotency, and temporary-file cleanup
- Implement monitoring, metrics, and centralized logging
- Containerize the API and worker services for deployment
- Add horizontal scaling and load testing for multiple concurrent video-processing jobs

---

## Key Learnings

This project explores several backend and distributed systems concepts:

- Asynchronous and queue-based architectures
- Separating CPU-intensive workloads from HTTP servers
- Redis and BullMQ job processing
- Video encoding and transcoding with FFmpeg
- HLS playlist and segment generation
- Adaptive bitrate streaming and browser buffering
- AWS S3 presigned uploads and private object storage
- Streaming data from S3 through Node.js
- Job state management using Redis and MongoDB
- Processing progress tracking and frontend synchronization
- Designing independently scalable API and worker components

---

## Related Repository

**Image Processing Pipeline:**  
https://github.com/Peyushxcode/image-processing-pipeline

The image and video services are maintained separately to support modular development and independent processing workloads.

---

## Author

**Peyush Sharma**

GitHub: https://github.com/Peyushxcode
