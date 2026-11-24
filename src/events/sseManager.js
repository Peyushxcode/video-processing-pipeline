const clients = new Map();

const addClient = (jobId, res) => {
    jobId = String(jobId);

    if (!clients.has(jobId)) {
        clients.set(jobId, new Set());
    }

    clients.get(jobId).add(res);

    console.log(`SSE client connected for job ${jobId}`);
};

const removeClient = (jobId, res) => {
    jobId = String(jobId);

    const jobClients = clients.get(jobId);

    if (!jobClients) return;

    jobClients.delete(res);

    if (jobClients.size === 0) {
        clients.delete(jobId);
    }

    console.log(`SSE client disconnected from job ${jobId}`);
};

const broadcast = (jobId, data) => {
    jobId = String(jobId);

    const jobClients = clients.get(jobId);

    if (!jobClients) return;

    const message = `data: ${JSON.stringify(data)}\n\n`;

    for (const res of jobClients) {
        if (!res.destroyed && !res.writableEnded) {
            res.write(message);
        }
    }
};

const sendHeartbeat = () => {

    for (const [jobId, jobClients] of clients) {

        for (const res of jobClients) {

            if (res.destroyed || res.writableEnded) {
                removeClient(jobId, res);
                continue;
            }

            res.write(": heartbeat\n\n");
        }
    }
};

const heartbeatInterval = setInterval(
    sendHeartbeat,
    15000
);

heartbeatInterval.unref();

module.exports = {
    addClient,
    removeClient,
    broadcast
};