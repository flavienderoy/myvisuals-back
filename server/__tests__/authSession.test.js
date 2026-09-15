/**
 * Tests de non-régression — isolation de la session à la connexion
 *
 * `POST /api/auth/login` appelait `signInWithPassword` sur le client Supabase
 * partagé par toute l'API. supabase-js garde alors la session en mémoire et
 * envoie le jeton de cet utilisateur à la place de la clé service_role : chaque
 * requête suivante, quel que soit son auteur, s'exécutait avec les droits RLS
 * du dernier compte connecté. Symptôme observé : un studio ne pouvait plus créer
 * d'entreprise (« new row violates row-level security policy for table
 * "clients" ») dès qu'un compte client s'était connecté après lui.
 *
 * Ces tests échouent si la connexion repasse par le client partagé.
 */
// Globals Vitest (describe, it, expect, vi, beforeEach) — activés dans vitest.config.js
const request = require('supertest');
const app = require('../app');
const supabase = require('../config/supabase');

const SESSION = { access_token: 'user-access-token', refresh_token: 'user-refresh-token' };
const USER = { id: '00000000-0000-0000-0000-0000000000bb', email: 'studio@exemple.fr' };

afterEach(() => {
    vi.restoreAllMocks();
});

describe('POST /api/auth/login — isolation de la session', () => {
    it("ouvre la session sur un client jetable, jamais sur le client partagé", async () => {
        const sessionSignIn = vi.fn(async () => ({ data: { session: SESSION, user: USER }, error: null }));
        vi.spyOn(supabase, 'createServerClient').mockReturnValue({ auth: { signInWithPassword: sessionSignIn } });
        const sharedSignIn = vi.spyOn(supabase.auth, 'signInWithPassword');
        // `audit_logs` — journalisation des tentatives d'authentification.
        vi.spyOn(supabase, 'from').mockReturnValue({ insert: () => Promise.resolve({ data: [], error: null }) });

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: USER.email, password: 'Str0ng!Pass' });

        expect(res.status).toBe(200);
        expect(res.body.session).toEqual(SESSION);
        expect(sessionSignIn).toHaveBeenCalledWith({ email: USER.email, password: 'Str0ng!Pass' });
        expect(sharedSignIn).not.toHaveBeenCalled();
    });

    it('fournit un nouveau client à chaque appel, distinct du client partagé', () => {
        const first = supabase.createServerClient();
        const second = supabase.createServerClient();

        expect(first).not.toBe(supabase);
        expect(second).not.toBe(first);
    });
});
