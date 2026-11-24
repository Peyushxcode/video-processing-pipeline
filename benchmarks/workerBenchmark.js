require("dotenv").config();

const { Queue, QueueEvents } = require("bullmq");

const connection = require("../src/config/redis");

const queue = new Queue("video-processing", {
    connection
});

const queueEvents = new QueueEvents("video-processing", {
    connection
});

const API_URL = "http://localhost:5200";

const TOTAL_JOBS = Number(process.env.TOTAL_JOBS || 12);

const S3_KEY = process.env.BENCHMARK_S3_KEY;

const registerVideo = async () => {

    const response = await fetch(
        `${API_URL}/api/video/register`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                s3Key: S3_KEY
            })
        }
    );

    if (!response.ok) {
        throw new Error(
            `Registration failed: ${response.status}`
        );
    }

    return await response.json();
};

const trackJob = async (jobId) => {

    const job = await queue.getJob(jobId);

    if (!job) {
        throw new Error(`Job ${jobId} not found`);
    }

    await job.waitUntilFinished(
        queueEvents,
        15 * 60 * 1000
    );

    const completedJob = await queue.getJob(jobId);

    const waitingTime =
        completedJob.processedOn - completedJob.timestamp;

    const processingTime =
        completedJob.finishedOn - completedJob.processedOn;

    const totalLatency =
        completedJob.finishedOn - completedJob.timestamp;

    console.log(
        `Job ${jobId} completed in ${processingTime / 1000}s`
    );

    return {
        jobId,
        waitingTime,
        processingTime,
        totalLatency,
        finishedOn: completedJob.finishedOn
    };
};

const runBenchmark = async () => {

    if (!S3_KEY) {
        throw new Error("BENCHMARK_S3_KEY is required");
    }

    await queueEvents.waitUntilReady();

    console.log(`Registering ${TOTAL_JOBS} videos...`);

    const startTime = Date.now();

    const jobs = await Promise.all(
        Array.from(
            { length: TOTAL_JOBS },
            () => registerVideo()
        )
    );

    const registrationTime = Date.now() - startTime;

    console.table(jobs.map(job => ({
        videoId: job.videoId,
        jobId: job.jobId
    })));

    console.log(
        `Registration took ${registrationTime}ms`
    );

    console.log("Waiting for all jobs to complete...");

    const results = await Promise.all(
        jobs.map(job => trackJob(job.jobId))
    );

    const endTime = Math.max(
        ...results.map(job => job.finishedOn)
    );

    const batchTime = (endTime - startTime) / 1000;

    const avgWaitingTime =
        results.reduce(
            (sum, job) => sum + job.waitingTime, 0
        ) / TOTAL_JOBS / 1000;

    const avgProcessingTime =
        results.reduce(
            (sum, job) => sum + job.processingTime, 0
        ) / TOTAL_JOBS / 1000;

    const avgLatency =
        results.reduce(
            (sum, job) => sum + job.totalLatency, 0
        ) / TOTAL_JOBS / 1000;

    const throughput = (TOTAL_JOBS / batchTime) * 60;

    console.log("\nIndividual Job Results:");

    console.table(results.map(job => ({
        jobId: job.jobId,
        waitingTime: `${(job.waitingTime / 1000).toFixed(2)}s`,
        processingTime: `${(job.processingTime / 1000).toFixed(2)}s`,
        totalLatency: `${(job.totalLatency / 1000).toFixed(2)}s`
    })));

    console.log("\nBenchmark Summary:");

    console.table({
        totalJobs: TOTAL_JOBS,
        registrationTime: `${registrationTime}ms`,
        batchTime: `${batchTime.toFixed(2)}s`,
        avgWaitingTime: `${avgWaitingTime.toFixed(2)}s`,
        avgProcessingTime: `${avgProcessingTime.toFixed(2)}s`,
        avgLatency: `${avgLatency.toFixed(2)}s`,
        throughput: `${throughput.toFixed(2)} videos/min`
    });
};

runBenchmark()
    .catch(err => {
        console.error(err);
        process.exitCode = 1;
    })
    .finally(async () => {
        await queueEvents.close();
        await queue.close();

        if (typeof connection.quit === "function") {
            await connection.quit();
        }
    });