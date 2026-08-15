/**
 * Tests — Sondes de supervision (liveness & readiness)
 *
 * Ces tests garantissent que le contrat des sondes ne casse pas : l'uptime
 * check externe, le HEALTHCHECK Docker, le smoke test de la CI et les
 * politiques d'alerte Cloud Monitoring en dépendent tous. Une régression
 * silencieuse ici rendrait la supervision aveugle sans que rien ne le signale.
 *
 * @see docs/SUPERVISION.md
 */
// Globals Vitest (describe, it, expect, vi, beforeEach) — activés dans vitest.config.js
const request = require('supertest');
const app = require('../app');
const pkg = require('../package.json');
const supabase = require('../config/supabase');

// `config/supabase` exporte un singleton : le contrôleur et ce test manipulent
// donc la même référence. On espionne ses méthodes plutôt que de simuler le
// module entier — les sondes réellement exécutées sont ainsi celles du code
// de production, seul l'accès réseau est neutralisé.
const mockFrom = vi.fn();
const mockListBuckets = vi.fn();

// Requête Supabase satisfaite : `.select().limit()` renvoie un thenable.
function okQuery() {
    return { select: () => ({ limit: () => Promise.resolve({ error: null, count: 0 }) }) };
}
function failingQuery(message) {
    return { select: () => ({ limit: () => Promise.resolve({ error: { message } }) }) };
}

beforeEach(() => {
    mockFrom.mockReset().mockImplementation(okQuery);
    mockListBuckets.mockReset().mockResolvedValue({ data: [], error: null });

    vi.spyOn(supabase, 'from').mockImplementation((...args) => mockFrom(...args));
    // `storage` est un accesseur sur le client Supabase : on le redéfinit sur
    // l'instance pour garantir que la sonde reçoit bien notre double.
    Object.defineProperty(supabase, 'storage', {
        value: { listBuckets: (...args) => mockListBuckets(...args) },
        configurable: true,
        writable: true,
    });
});

afterEach(() => {
    vi.restoreAllMocks();
    delete supabase.storage;
});

describe('GET /health — sonde de vivacité', () => {
    it('répond 200 avec un statut ok', async () => {
        const res = await request(app).get('/health');

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('status', 'ok');
        expect(res.body).toHaveProperty('message', 'Visuals.co API is running');
        expect(res.body).toHaveProperty('timestamp');
    });

    it('expose la version réelle issue de package.json', async () => {
        const res = await request(app).get('/health');

        // Garde-fou anti-dérive : la version annoncée par la sonde doit être
        // celle du paquet, jamais une constante codée en dur — sans quoi le
        // journal de version et la production peuvent diverger sans alerte.
        expect(res.body.version).toBe(pkg.version);
    });

    it('expose la révision déployée et la durée de fonctionnement', async () => {
        const res = await request(app).get('/health');

        expect(res.body).toHaveProperty('revision');
        expect(typeof res.body.uptimeSeconds).toBe('number');
    });

    it('retourne un timestamp ISO valide', async () => {
        const res = await request(app).get('/health');
        const timestamp = new Date(res.body.timestamp);

        expect(timestamp.toISOString()).toBe(res.body.timestamp);
    });

    it('retourne un content-type JSON', async () => {
        const res = await request(app).get('/health');

        expect(res.headers['content-type']).toMatch(/application\/json/);
    });

    it("n'interroge aucune dépendance externe", async () => {
        await request(app).get('/health');

        // La liveness doit rester sans I/O : y ajouter un appel base ferait
        // redémarrer le conteneur à chaque hoquet de Supabase.
        expect(mockFrom).not.toHaveBeenCalled();
        expect(mockListBuckets).not.toHaveBeenCalled();
    });

    it('est également servie sur /health/live', async () => {
        const res = await request(app).get('/health/live');

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ok');
    });
});

describe('GET /health/ready — sonde d’aptitude', () => {
    it('répond 200 / ok quand toutes les dépendances répondent', async () => {
        const res = await request(app).get('/health/ready');

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ok');
        expect(res.body.checks.database.status).toBe('ok');
        expect(res.body.checks.storage.status).toBe('ok');
    });

    it('mesure réellement la base et le stockage', async () => {
        const res = await request(app).get('/health/ready');

        expect(mockFrom).toHaveBeenCalledWith('profiles');
        expect(mockListBuckets).toHaveBeenCalled();
        expect(typeof res.body.checks.database.latencyMs).toBe('number');
        expect(typeof res.body.checks.storage.latencyMs).toBe('number');
    });

    it('répond 503 / down quand la base est injoignable', async () => {
        mockFrom.mockImplementation(() => failingQuery('connection refused'));

        const res = await request(app).get('/health/ready');

        // 503 est le déclencheur de l'alerte S1 : la base est critique,
        // aucune route métier ne fonctionne sans elle.
        expect(res.status).toBe(503);
        expect(res.body.status).toBe('down');
        expect(res.body.checks.database.error).toContain('connection refused');
    });

    it('répond 200 / degraded quand seul le stockage est en défaut', async () => {
        mockListBuckets.mockResolvedValue({ error: { message: 'bucket unreachable' } });

        const res = await request(app).get('/health/ready');

        // Dégradation partielle : les projets et les échanges restent
        // consultables. Alerter en S1 ici produirait du bruit d'astreinte.
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('degraded');
        expect(res.body.checks.storage.status).toBe('down');
    });

    it('expose le contexte d’exécution nécessaire au diagnostic', async () => {
        const res = await request(app).get('/health/ready');

        expect(res.body.version).toBe(pkg.version);
        expect(res.body).toHaveProperty('revision');
        expect(res.body).toHaveProperty('environment');
        expect(res.body.runtime).toHaveProperty('node');
        expect(typeof res.body.runtime.heapUsedMB).toBe('number');
        expect(res.body.monitoring).toHaveProperty('errorTracking');
    });

    it('ne laisse pas une exception de sonde faire tomber la route', async () => {
        mockFrom.mockImplementation(() => {
            throw new Error('client not initialised');
        });

        const res = await request(app).get('/health/ready');

        // Une sonde qui échoue doit produire un diagnostic, pas un crash.
        expect(res.status).toBe(503);
        expect(res.body.checks.database.status).toBe('down');
    });
});
