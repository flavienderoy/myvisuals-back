/**
 * Tests — Politique CORS (ANO-2026-005)
 *
 * L'en-tête `Origin` d'un navigateur ne porte jamais de barre oblique finale.
 * Une variable CLIENT_URL renseignée avec un slash terminal ne correspondait à
 * aucune origine : le préflight répondait 204 mais sans
 * `Access-Control-Allow-Origin`, et le front était intégralement bloqué — sans
 * la moindre erreur côté serveur.
 *
 * Ces tests verrouillent la normalisation des deux côtés de la comparaison.
 * Retirer `normalizeOrigin` dans app.js les fait échouer.
 */
const request = require('supertest');

const ORIGIN = 'https://myvisuals-client.vercel.app';

// CLIENT_URL est lue au chargement du module : on la pose avant le require,
// et volontairement AVEC le slash fautif — c'est le cas qui a cassé la prod.
process.env.CLIENT_URL = `${ORIGIN}/`;

const app = require('../app');

describe('CORS — normalisation des origines', () => {
    it('accepte l’origine du front malgré un CLIENT_URL avec slash terminal', async () => {
        const res = await request(app)
            .options('/api/projects')
            .set('Origin', ORIGIN)
            .set('Access-Control-Request-Method', 'GET');

        expect(res.headers['access-control-allow-origin']).toBe(ORIGIN);
    });

    it('émet l’en-tête sur une requête simple, pas seulement au préflight', async () => {
        const res = await request(app).get('/health').set('Origin', ORIGIN);
        expect(res.headers['access-control-allow-origin']).toBe(ORIGIN);
    });

    it('autorise localhost en développement', async () => {
        const res = await request(app).get('/health').set('Origin', 'http://localhost:5173');
        expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    });

    it('tolère une origine différant par la casse ou un slash', async () => {
        const res = await request(app).get('/health').set('Origin', `${ORIGIN}/`);
        expect(res.headers['access-control-allow-origin']).toBeDefined();
    });

    it('rejette une origine non autorisée', async () => {
        const res = await request(app).get('/health').set('Origin', 'https://attaquant.example');
        // Pas d'en-tête émis : le navigateur bloquera la réponse.
        expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('sert les requêtes sans en-tête Origin (sondes, curl, serveur à serveur)', async () => {
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
    });
});
