require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Routes
const projectRoutes = require('./routes/projectRoutes');
const clientRoutes = require('./routes/clientRoutes');
const assetRoutes = require('./routes/assetRoutes');
const lookRoutes = require('./routes/lookRoutes');
const taskRoutes = require('./routes/taskRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const messageRoutes = require('./routes/messageRoutes');
const moodBoardRoutes = require('./routes/moodBoardRoutes');
const profileRoutes = require('./routes/profileRoutes');
const quoteRoutes = require('./routes/quoteRoutes');
const timeEntryRoutes = require('./routes/timeEntryRoutes');
const activityRoutes = require('./routes/activityRoutes');
const watermarkRoutes = require('./routes/watermarkRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const smartFolderRoutes = require('./routes/smartFolderRoutes');
const permissionRoutes = require('./routes/permissionRoutes');
const annotationRoutes = require('./routes/annotationRoutes');

const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./swaggerOptions');

const app = express();

// ─── General Middleware ────────────────────────────────
app.use(cors({
    origin: [
        process.env.CLIENT_URL,
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175'
    ].filter(Boolean),
    credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// ─── Security Middleware ───────────────────────────────
// Helmet: sets various HTTP headers for security (XSS, CSP, HSTS, etc.)
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate Limiting: protect against brute-force and DDoS
// In a real production app, consider higher limits for dashboard users or disabling for local dev.
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'development' ? 5000 : 500, // max 500 requests per windowMs per IP (5000 in dev)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', apiLimiter);

// Only enable morgan logging when not in test mode
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
}

// API Routes
app.use('/api/projects', projectRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/looks', lookRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/mood-boards', moodBoardRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/time-entries', timeEntryRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/watermark', watermarkRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/smart-folders', smartFolderRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/annotations', annotationRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Visuals.co API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: `Route ${req.method} ${req.url} not found` });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
});

module.exports = app;
