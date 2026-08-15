const app = require('./app');
const { logger } = require('./utils/logger');
const pkg = require('./package.json');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    logger.info('server.started', {
        port: Number(PORT),
        version: pkg.version,
        environment: process.env.NODE_ENV || 'development',
        healthCheck: `http://localhost:${PORT}/health`,
        readinessCheck: `http://localhost:${PORT}/health/ready`,
        clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
    });
});

/**
 * Arrêt propre.
 *
 * Cloud Run envoie SIGTERM avant de retirer une instance (déploiement d'une
 * nouvelle révision, scale-down). Sans ce hook, les requêtes en cours sont
 * coupées net : l'utilisateur voit une erreur réseau à chaque déploiement, et
 * l'indicateur « taux de 5xx » remonte artificiellement. On cesse d'accepter
 * de nouvelles connexions puis on laisse les requêtes en vol se terminer.
 */
function shutdown(signal) {
    logger.info('server.shutdown_requested', { signal });

    server.close(() => {
        logger.info('server.stopped', { signal });
        process.exit(0);
    });

    // Garde-fou : si une connexion longue ne se libère pas, on force l'arrêt
    // avant que l'orchestrateur ne tue le process de façon brutale.
    setTimeout(() => {
        logger.warn('server.forced_shutdown', { signal, reason: 'grace period expired' });
        process.exit(1);
    }, 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = server;
