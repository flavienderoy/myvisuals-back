/**
 * Monitoring — initialisation du suivi d'erreurs (Sentry).
 *
 * L'intégration est *conditionnelle* : sans `SENTRY_DSN` dans l'environnement,
 * ce module est un no-op complet. Aucun appel réseau, aucune erreur au boot.
 * C'est ce qui permet de garder les tests, la CI et le développement local
 * totalement hors ligne, tout en activant la sonde applicative en production
 * par la simple présence d'une variable d'environnement.
 *
 * Périmètre supervisé par cette sonde : exceptions non gérées du process Node
 * et erreurs 5xx remontées par le middleware d'erreur Express.
 */
const { logger } = require('../utils/logger');

let Sentry = null;
let enabled = false;

function initMonitoring() {
    const dsn = process.env.SENTRY_DSN;

    if (!dsn) {
        logger.info('monitoring.disabled', {
            reason: 'SENTRY_DSN absent — suivi d’erreurs externe désactivé',
        });
        return null;
    }

    try {
        // Require paresseux : si le paquet n'est pas installé (image allégée,
        // fork sans la dépendance), l'API démarre quand même.
        Sentry = require('@sentry/node');

        Sentry.init({
            dsn,
            environment: process.env.NODE_ENV || 'development',
            // Version applicative : permet à Sentry de rattacher chaque erreur
            // à une release du journal de version (CHANGELOG.md).
            release: `visuals-api@${require('../package.json').version}`,
            // Échantillonnage des traces de performance : 10 % en production
            // pour rester dans le quota gratuit tout en gardant un signal utile.
            tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
            // Ne jamais transmettre de données personnelles à un tiers (RGPD).
            sendDefaultPii: false,
            beforeSend(event) {
                // Filet de sécurité : on retire les en-têtes porteurs de secrets
                // avant tout envoi vers un service externe.
                if (event.request?.headers) {
                    delete event.request.headers.authorization;
                    delete event.request.headers.cookie;
                }
                return event;
            },
        });

        enabled = true;
        logger.info('monitoring.enabled', { provider: 'sentry' });
        return Sentry;
    } catch (err) {
        // Une sonde qui tombe ne doit jamais faire tomber l'application.
        logger.error('monitoring.init_failed', { error: err.message });
        Sentry = null;
        enabled = false;
        return null;
    }
}

/**
 * Remonte une exception à la sonde externe si elle est active.
 * @param {Error} error
 * @param {object} [context] - contexte additionnel (requestId, userId, route…)
 */
function captureException(error, context = {}) {
    if (!enabled || !Sentry) return;
    try {
        Sentry.withScope((scope) => {
            if (context.requestId) scope.setTag('request_id', context.requestId);
            if (context.route) scope.setTag('route', context.route);
            if (context.userId) scope.setUser({ id: context.userId });
            scope.setExtras(context);
            Sentry.captureException(error);
        });
    } catch {
        // Silencieux volontairement : l'échec d'une sonde est non bloquant.
    }
}

const isMonitoringEnabled = () => enabled;

module.exports = { initMonitoring, captureException, isMonitoringEnabled };
