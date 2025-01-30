import express from 'express';
import { randomBytes } from 'crypto';

const app = express();
const port = 3000;

app.use((req, res, next) => {
    const start = Date.now();
    const { method, url } = req;
    const remoteAddress = req.socket.remoteAddress;
    const remotePort = req.socket.remotePort;

    console.log(`${remoteAddress}:${remotePort} - - [${new Date().toISOString()}] "Received: ${method} ${url} HTTP/1.1"`);

    res.on('finish', () => {
        const duration = Date.now() - start;
        const status = res.statusCode;
        const contentLength = res.get('Content-Length') || 0;
        console.log(`${remoteAddress}:${remotePort} - - [${new Date().toISOString()}] "${method} ${url} HTTP/1.1" ${status} ${contentLength} ${duration}ms`);
    });

    res.on('close', () => {
        if (!res.finished) {
            const duration = Date.now() - start;
            const contentLength = res.get('Content-Length') || 0;
            console.log(`${remoteAddress} - - [${new Date().toISOString()}] "${method} ${url} HTTP/1.1" 499 ${contentLength} ${duration}ms`);
        }
    });

    next();
});

app.get('*', (req, res) => {
    let size = parseInt(req.query.size);
    let time = parseInt(req.query.time);

    if (!size) size = 65536
    if (!time) time = 16

    // Calculate the duration in milliseconds; handle the case where time = 0 by sending instantly
    const totalDuration = Math.max(time * 1000, 1); // Avoid zero, set a minimum duration to 1ms
    const startTime = Date.now(); // Capture the start time

    let bytesSent = 0;

    // Set headers to prevent caching
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const sendChunk = () => {
        const currentTime = Date.now();
        const elapsedTime = currentTime - startTime;
        const remainingTime = totalDuration - elapsedTime;

        if (bytesSent < size) {
            if (remainingTime <= 0) {
                // If the remaining time is zero or negative, send the last chunk and end the response
                const data = randomBytes(size - bytesSent);
                const readableData = data.toString('ascii').replace(/[\x00-\x1F\x7F-\xFF]/g, c => {
                    return String.fromCharCode(32 + (c.charCodeAt(0) % 95));
                });
                res.write(readableData);
                res.end();
            } else {
                // Dynamically calculate the size of each chunk based on remaining time and bytes
                const chunkSize = Math.min(1024, size - bytesSent, Math.ceil((size - bytesSent) / (remainingTime / 1000)));
                const data = randomBytes(chunkSize);
                const readableData = data.toString('ascii').replace(/[\x00-\x1F\x7F-\xFF]/g, c => {
                    return String.fromCharCode(32 + (c.charCodeAt(0) % 95));
                });
                res.write(readableData);
                bytesSent += chunkSize;
                setTimeout(sendChunk, Math.max(remainingTime / Math.ceil((size - bytesSent) / chunkSize), 1)); // Ensure there is at least 1ms delay
            }
        } else {
            res.end();
        }
    };

    sendChunk(); // Start sending chunks
});

app.listen(port, () => {
    console.log(`Server running on https://localhost:${port}`);
});
