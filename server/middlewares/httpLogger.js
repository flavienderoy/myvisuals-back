const { logger } = require('../utils/logger');

// Routes exclues du log d'accès : les sondes de disponibilité tapent /health
// toutes les 60 s (Cloud Run, Docker HEALTHCHECK, uptime check externe).
// Les journaliser noierait le signal utile et gonflerait le quota Cloud Logging.
const SKIP_PATHS = new Set(['/health', '/health/live']);

/**
 * Log d'accès structuré.
 *
 * Émet une ligne JSON par requête terminée, avec la severity dérivée du code
 * de statut. Ce sont ces lignes qui alimentent les *log-based metrics* :
 *   - taux de 5xx        → severity=ERROR sur /api/**
 *   - saturation du quota → statusCode=429
 *   - latence            → champ latencyMs
 *
 * @see docs/SUPERVISION.md § Indicateurs
 */
function httpLogger(req, res, next) {
    if (SKIP_PATHS.has(req.path)) return next();

    const startedAt = process.hrtime.bigint();

    res.on('finish', () => {
        const latencyMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
        const { statusCode } = res;

        const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

        logger[level](`${req.method} ${req.originalUrl} ${statusCode}`, {
            requestId: req.id,
            method: req.method,
            path: req.originalUrl,
            statusCode,
            latencyMs: Math.round(latencyMs * 100) / 100,
            userId: req.user?.id,
            userAgent: req.get('user-agent'),
            // req.ip est fiable grâce à `app.set('trust proxy', 1)`.
            ip: req.ip,
        });
    });

    next();
}

module.exports = httpLogger;
