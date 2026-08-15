const { logger } = require('../utils/logger');
const { captureException } = require('../config/monitoring');

/**
 * Gestionnaire 404 — route inconnue.
 * Journalisé en WARNING (et non ERROR) : un 404 est une erreur d'appelant,
 * pas une défaillance du service. Le distinguer évite de polluer l'indicateur
 * « taux d'erreurs serveur » avec du bruit.
 */
function notFoundHandler(req, res) {
    logger.warn('http.route_not_found', {
        requestId: req.id,
        method: req.method,
        path: req.originalUrl,
    });

    res.status(404).json({
        error: `Route ${req.method} ${req.url} not found`,
        requestId: req.id,
    });
}

/**
 * Gestionnaire d'erreurs centralisé.
 *
 * Trois responsabilités, dans cet ordre :
 *   1. journaliser l'erreur complète (stack incluse) côté serveur ;
 *   2. la remonter à la sonde applicative externe (Sentry) si elle est active ;
 *   3. renvoyer au client une réponse *sans détail d'implémentation*, mais
 *      porteuse du `requestId` — c'est ce que l'utilisateur transmettra au
 *      support pour que l'anomalie soit instruite sans jeu de devinettes.
 *
 * La stack n'est jamais exposée hors développement : elle révèle
 * l'arborescence du serveur et les versions des dépendances.
 */
// `next` est indispensable : Express n'identifie un gestionnaire d'erreurs
// qu'à son arité de 4 paramètres.
function errorHandler(err, req, res, next) {
    const statusCode = err.statusCode || err.status || 500;
    const isServerError = statusCode >= 500;

    logger[isServerError ? 'error' : 'warn']('http.request_failed', {
        requestId: req.id,
        method: req.method,
        path: req.originalUrl,
        statusCode,
        errorName: err.name,
        errorMessage: err.message,
        stack: isServerError ? err.stack : undefined,
        userId: req.user?.id,
    });

    // Seules les vraies défaillances serveur alimentent la sonde externe :
    // remonter les 4xx saturerait le quota Sentry avec des erreurs d'appelant.
    if (isServerError) {
        captureException(err, {
            requestId: req.id,
            route: `${req.method} ${req.originalUrl}`,
            userId: req.user?.id,
        });
    }

    res.status(statusCode).json({
        error: isServerError ? 'Internal server error' : err.message,
        message: process.env.NODE_ENV === 'development' ? err.message : undefined,
        requestId: req.id,
    });
}

/**
 * Filet de dernier recours pour les erreurs hors cycle requête/réponse.
 *
 * Une `unhandledRejection` ou une `uncaughtException` non traitée tue le
 * process : sur Cloud Run le conteneur redémarre, et sans ce hook l'incident
 * ne laisse aucune trace exploitable. On journalise en CRITICAL et on laisse
 * délibérément le process s'arrêter sur `uncaughtException` — après une
 * exception non capturée, l'état de l'application n'est plus garanti.
 */
function registerProcessHandlers() {
    process.on('unhandledRejection', (reason) => {
        logger.critical('process.unhandled_rejection', {
            errorMessage: reason instanceof Error ? reason.message : String(reason),
            stack: reason instanceof Error ? reason.stack : undefined,
        });
        captureException(reason instanceof Error ? reason : new Error(String(reason)), {
            kind: 'unhandledRejection',
        });
    });

    process.on('uncaughtException', (err) => {
        logger.critical('process.uncaught_exception', {
            errorMessage: err.message,
            stack: err.stack,
        });
        captureException(err, { kind: 'uncaughtException' });
        // Laisser le temps à la sonde d'émettre avant l'arrêt.
        setTimeout(() => process.exit(1), 1000).unref();
    });
}

module.exports = { notFoundHandler, errorHandler, registerProcessHandlers };
