/**
 * Logger structuré — sortie JSON une-ligne compatible Google Cloud Logging.
 *
 * Pourquoi pas `morgan('dev')` seul ?
 * `morgan('dev')` produit du texte coloré : Cloud Logging l'ingère comme une
 * chaîne opaque, avec une severity toujours à DEFAULT. Impossible, dans ces
 * conditions, de construire une *log-based metric* (« taux de 5xx ») ni une
 * politique d'alerte. En émettant du JSON avec un champ `severity` reconnu,
 * chaque champ devient requêtable dans Cloud Logging et alertable.
 *
 * Choix d'implémentation : pas de dépendance supplémentaire (pino, winston).
 * Le besoin — sérialiser un objet en JSON sur stdout — ne justifie pas
 * d'élargir la surface de dépendances à maintenir et à auditer.
 *
 * @see docs/SUPERVISION.md
 */

// Niveaux alignés sur LogSeverity de Google Cloud Logging.
const SEVERITY = {
    debug: 'DEBUG',
    info: 'INFO',
    warn: 'WARNING',
    error: 'ERROR',
    critical: 'CRITICAL',
};

const SERVICE = process.env.K_SERVICE || 'visuals-api';
const REVISION = process.env.K_REVISION || process.env.GIT_COMMIT || 'local';

// En test, on n'écrit rien : les logs pollueraient la sortie de Vitest.
const isSilent = () => process.env.NODE_ENV === 'test';

// En développement, une ligne lisible par un humain vaut mieux que du JSON.
const isPretty = () =>
    process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

function write(level, message, context = {}) {
    if (isSilent()) return;

    if (isPretty()) {
        const extras = Object.keys(context).length ? ` ${JSON.stringify(context)}` : '';
        console.log(`[${SEVERITY[level]}] ${message}${extras}`);
        return;
    }

    const entry = {
        severity: SEVERITY[level],
        message,
        timestamp: new Date().toISOString(),
        service: SERVICE,
        revision: REVISION,
        ...context,
    };

    // stderr pour ERROR/CRITICAL : Cloud Run les classe automatiquement comme
    // erreurs même si le parsing JSON échoue.
    const stream = level === 'error' || level === 'critical' ? process.stderr : process.stdout;
    stream.write(`${JSON.stringify(entry)}\n`);
}

const logger = {
    debug: (message, context) => write('debug', message, context),
    info: (message, context) => write('info', message, context),
    warn: (message, context) => write('warn', message, context),
    error: (message, context) => write('error', message, context),
    critical: (message, context) => write('critical', message, context),
};

module.exports = { logger, SEVERITY };
