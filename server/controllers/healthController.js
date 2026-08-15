const supabase = require('../config/supabase');
const { logger } = require('../utils/logger');
const { isMonitoringEnabled } = require('../config/monitoring');
const pkg = require('../package.json');

// Au-delà de ce délai, une dépendance est considérée comme non disponible.
// 3 s : au-dessus du p99 observé sur Supabase (~150 ms) tout en restant sous
// le timeout de la sonde externe (10 s) pour éviter un faux négatif en cascade.
const PROBE_TIMEOUT_MS = Number(process.env.HEALTH_PROBE_TIMEOUT_MS || 3000);

const startedAt = Date.now();

/**
 * Version applicative, lue depuis package.json.
 *
 * Elle était auparavant codée en dur dans la réponse `/health`, ce qui la
 * faisait diverger silencieusement du numéro publié dans CHANGELOG.md. Un
 * `curl /health` doit permettre de savoir *avec certitude* quelle version
 * tourne réellement en production — c'est le lien entre le journal de version
 * et l'environnement déployé.
 */
const VERSION = pkg.version;

// Renseignés automatiquement par Cloud Run, permettent de rattacher une
// réponse de sonde à une révision précise du service.
const REVISION = process.env.K_REVISION || process.env.GIT_COMMIT || 'local';

function withTimeout(promise, ms, label) {
    return Promise.race([
        Promise.resolve(promise),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`${label} probe timed out after ${ms}ms`)), ms).unref?.()
        ),
    ]);
}

/**
 * Sonde base de données : lecture réelle sur PostgreSQL via Supabase.
 * On compte les lignes d'une table légère sans rapatrier de données (`head`),
 * ce qui valide la connectivité, l'authentification et le droit de lecture.
 */
async function probeDatabase() {
    const started = Date.now();
    try {
        const { error } = await withTimeout(
            supabase.from('profiles').select('id', { head: true, count: 'exact' }).limit(1),
            PROBE_TIMEOUT_MS,
            'database'
        );
        if (error) throw new Error(error.message);
        return { status: 'ok', latencyMs: Date.now() - started };
    } catch (err) {
        return { status: 'down', latencyMs: Date.now() - started, error: err.message };
    }
}

/**
 * Sonde stockage objet : les visuels sont le cœur du produit. Une API debout
 * mais un bucket injoignable est une panne fonctionnelle totale, invisible
 * d'une simple sonde HTTP — d'où une sonde dédiée.
 */
async function probeStorage() {
    const started = Date.now();
    try {
        const { error } = await withTimeout(
            supabase.storage.listBuckets(),
            PROBE_TIMEOUT_MS,
            'storage'
        );
        if (error) throw new Error(error.message);
        return { status: 'ok', latencyMs: Date.now() - started };
    } catch (err) {
        return { status: 'down', latencyMs: Date.now() - started, error: err.message };
    }
}

/**
 * GET /health — sonde de vivacité (*liveness*).
 *
 * Doit rester rapide et sans entrée/sortie : elle répond à la seule question
 * « le process Node répond-il ? ». C'est cette route qu'interrogent le
 * HEALTHCHECK Docker, Cloud Run et le smoke test de la CI. Y ajouter un appel
 * base de données ferait redémarrer le conteneur à chaque hoquet de Supabase —
 * une panne de dépendance se transformerait en panne totale.
 */
exports.liveness = (req, res) => {
    res.json({
        status: 'ok',
        message: 'Visuals.co API is running',
        timestamp: new Date().toISOString(),
        version: VERSION,
        revision: REVISION,
        uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    });
};

/**
 * GET /health/ready — sonde d'aptitude (*readiness*).
 *
 * Interroge réellement chaque dépendance externe et agrège leur état :
 *   - `ok`       → toutes les dépendances répondent          → HTTP 200
 *   - `degraded` → une dépendance non critique est en défaut → HTTP 200
 *   - `down`     → la base de données est injoignable        → HTTP 503
 *
 * Le code HTTP est signifiant : c'est lui que l'uptime check externe et les
 * politiques d'alerte Cloud Monitoring utilisent comme déclencheur. La
 * distinction 200/503 évite d'alerter en S1 pour une dégradation partielle.
 */
exports.readiness = async (req, res) => {
    const [database, storage] = await Promise.all([probeDatabase(), probeStorage()]);

    // La base est critique : sans elle, aucune route métier ne fonctionne.
    // Le stockage dégrade le service (miniatures, téléchargements) sans
    // empêcher la consultation des projets et des échanges.
    const status =
        database.status === 'down' ? 'down' : storage.status === 'down' ? 'degraded' : 'ok';

    const memory = process.memoryUsage();
    const payload = {
        status,
        timestamp: new Date().toISOString(),
        version: VERSION,
        revision: REVISION,
        environment: process.env.NODE_ENV || 'development',
        uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
        checks: { database, storage },
        runtime: {
            node: process.version,
            heapUsedMB: Math.round(memory.heapUsed / 1024 / 1024),
            rssMB: Math.round(memory.rss / 1024 / 1024),
        },
        monitoring: { errorTracking: isMonitoringEnabled() ? 'sentry' : 'disabled' },
    };

    if (status !== 'ok') {
        logger.error('health.degraded', {
            requestId: req.id,
            status,
            database: database.status,
            storage: storage.status,
            databaseError: database.error,
            storageError: storage.error,
        });
    }

    res.status(status === 'down' ? 503 : 200).json(payload);
};

module.exports.__internals = { probeDatabase, probeStorage, PROBE_TIMEOUT_MS };
