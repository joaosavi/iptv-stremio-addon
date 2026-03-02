// Server for IPTV Stremio Addon
const express = require('express');
const path = require('path');
const env = require('./src/config/env');

const app = express();
const staticDir = path.join(__dirname, 'public');

app.use(express.static(staticDir));
app.use(express.json({ limit: '512kb' }));

app.use((req, res, next) => {
    res.setHeader('X-App', 'IPTV-Stremio-Addon');
    next();
});

app.get('/health', (req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));
app.get('/favicon.ico', (req, res) => res.status(204).end());

app.use(require('./src/routes/api'));
app.use(require('./src/routes/pages'));
app.use(require('./src/routes/stremio'));

app.use('*', (req, res) => res.status(404).json({ error: 'Not found' }));

app.use((error, req, res, next) => {
    console.error('[SERVER] Unhandled error:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Internal server error' });
});

app.listen(env.PORT, () => {
    console.log(`🚀 Server running → http://localhost:${env.PORT} (debug=${env.DEBUG}, prefetch=${env.PREFETCH_ENABLED})`);
});