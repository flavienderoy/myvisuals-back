require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// ─── Supervision ───────────────────────────────────────
// Initialisé au plus tôt : une erreur survenant au chargement des routes doit
// pouvoir être capturée par la sonde applicative. Sans SENTRY_DSN, no-op.
const { initMonitoring } = require('./config/monitoring');
const { notFoundHandler, errorHandler, registerProcessHandlers } = require('./middlewares/errorHandler');
const requestId = require('./middlewares/requestId');
const { logger } = require('./utils/logger');
const httpLogger = require('./middlewares/httpLogger');

initMonitoring();
registerProcessHandlers();

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
const timeEntryRoutes = require('./routes/timeEntryRoutes');
const activityRoutes = require('./routes/activityRoutes');
const watermarkRoutes = require('./routes/watermarkRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const smartFolderRoutes = require('./routes/smartFolderRoutes');
const permissionRoutes = require('./routes/permissionRoutes');
const annotationRoutes = require('./routes/annotationRoutes');
const teamRoutes = require('./routes/teamRoutes');
const publicRoutes = require('./routes/publicRoutes');
const conversationRoutes = require('./routes/conversationRoutes');
const authRoutes = require('./routes/authRoutes');
const healthRoutes = require('./routes/healthRoutes');

const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./swaggerOptions');

const app = express();

// Trust reverse proxies (Google Cloud Run, Vercel, Nginx)
app.set('trust proxy', 1);

// ─── Traçabilité ───────────────────────────────────────
// Tout premier middleware : chaque requête — y compris celles rejetées plus
// bas par le CORS ou le rate limiter — doit porter un identifiant de
// corrélation exploitable en cas d'anomalie.
app.use(requestId);

// ─── General Middleware ────────────────────────────────
// Origines autorisées, normalisées.
//
// L'en-tête `Origin` d'un navigateur ne porte jamais de barre oblique finale.
// Une variable d'environnement renseignée avec « https://exemple.app/ » ne
// correspondait donc à aucune origine : le préflight répondait 204 sans
// `Access-Control-Allow-Origin`, et toutes les requêtes du front étaient
// bloquées — sans la moindre erreur côté serveur (ANO-2026-005).
// On compare désormais des valeurs normalisées des deux côtés.
const normalizeOrigin = (value) => (value || '').trim().replace(/\/+$/, '').toLowerCase();

const ALLOWED_ORIGINS = [
    process.env.CLIENT_URL,
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
].filter(Boolean).map(normalizeOrigin);

app.use(cors({
    origin(origin, callback) {
        // Absence d'Origin : appels serveur à serveur, sondes, curl. Autorisés.
        if (!origin) return callback(null, true);

        if (ALLOWED_ORIGINS.includes(normalizeOrigin(origin))) return callback(null, true);

        // Refus journalisé : une origine rejetée est soit une tentative
        // d'accès illégitime, soit une erreur de configuration. Sans cette
        // trace, les deux sont indiscernables et parfaitement silencieuses.
        logger.warn('cors.origin_rejected', { origin, allowed: ALLOWED_ORIGINS });
        return callback(null, false);
    },
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
const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDev ? 10000 : 1000, // generous limits — the dashboard fires many parallel calls on load
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
    skip: isDev ? (req) => {
        // Never rate-limit localhost during development
        const ip = req.ip || req.connection?.remoteAddress || '';
        return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
    } : undefined,
});
app.use('/api/', apiLimiter);

// ─── Journalisation ────────────────────────────────────
// En développement : morgan('dev'), lisible à l'œil nu pendant le codage.
// Hors développement : log d'accès JSON structuré, indispensable pour que
// Cloud Logging puisse en dériver des métriques et des alertes.
// En test : rien, pour ne pas polluer la sortie de Vitest.
if (isDev) {
    app.use(morgan('dev'));
} else if (process.env.NODE_ENV !== 'test') {
    app.use(httpLogger);
}

// ─── Supervision ───────────────────────────────────────
// Monté avant les routes métier et hors du préfixe /api : les sondes ne
// doivent jamais être bloquées par le rate limiter, sous peine de déclencher
// une fausse alerte d'indisponibilité en cas de pic de trafic.
app.use(healthRoutes);

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
app.use('/api/time-entries', timeEntryRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/watermark', watermarkRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/smart-folders', smartFolderRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/annotations', annotationRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/auth', authRoutes);

// ─── Gestion des erreurs ───────────────────────────────
// Toujours en dernier : Express n'atteint ces handlers qu'après avoir épuisé
// les routes déclarées au-dessus.
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
