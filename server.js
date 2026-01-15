const express = require('express');
const path = require('path');
const { handler } = require('./netlify/functions/planning-center-events');

const app = express();
const PORT = 3000;

// Serve static files from 'public' directory
app.use(express.static('public'));

// Mock Netlify Function Context
const mockContext = {};

// Route for the function
app.get('/.netlify/functions/planning-center-events', async (req, res) => {
    // Convert Express req to Netlify event object
    const event = {
        httpMethod: req.method,
        queryStringParameters: req.query,
        body: req.body ? JSON.stringify(req.body) : null
    };

    try {
        const result = await handler(event, mockContext);

        // Apply headers
        if (result.headers) {
            Object.keys(result.headers).forEach(key => {
                res.setHeader(key, result.headers[key]);
            });
        }

        // Send status and body
        res.status(result.statusCode).send(result.body);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`\n--- Local Dev Server Running ---`);
    console.log(`View Site: http://localhost:${PORT}`);
    console.log(`API Endpoint: http://localhost:${PORT}/.netlify/functions/planning-center-events`);
    console.log(`--------------------------------\n`);
});
