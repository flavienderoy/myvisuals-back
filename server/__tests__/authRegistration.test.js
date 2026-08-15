/**
 * Tests de non-régression — attribution du rôle à l'inscription
 *
 * Couvre l'anomalie ANO-2026-003 : une inscription avec le rôle « Studio »
 * aboutissait à un profil « Client », sans qu'aucune erreur ne soit remontée.
 * Le défaut venait d'une contrainte CHECK en base ne connaissant pas la valeur
 * `studio`, doublée de deux mécanismes de repli qui masquaient le rejet.
 *
 * Ces tests échouent si le correctif est retiré : ils vérifient que le rôle
 * demandé est bien celui écrit dans `profiles`, et qu'un rejet d'écriture ne
 * passe plus inaperçu.
 *
 * @see docs/anomalies/ANO-2026-003.md
 */
// Globals Vitest (describe, it, expect, vi, beforeEach) — activés dans vitest.config.js
const request = require('supertest');
const app = require('../app');
const supabase = require('../config/supabase');

const VALID_PASSWORD = 'Str0ng!Pass';
const NEW_USER_ID = '00000000-0000-0000-0000-0000000000aa';

// Capture les lignes écrites dans `profiles` pour pouvoir les inspecter.
let profileUpserts;
let upsertError;

beforeEach(() => {
    profileUpserts = [];
    upsertError = null;

    vi.spyOn(supabase, 'from').mockImplementation((table) => {
        if (table === 'profiles') {
            return {
                upsert: (row) => {
                    profileUpserts.push(row);
                    return Promise.resolve({ data: [row], error: upsertError });
                },
            };
        }
        // `audit_logs` — journalisation des tentatives d'authentification.
        return { insert: () => Promise.resolve({ data: [], error: null }) };
    });

    supabase.auth.admin = {
        createUser: vi.fn(async ({ user_metadata }) => ({
            data: { user: { id: NEW_USER_ID, email: 'nouveau@studio.fr', user_metadata } },
            error: null,
        })),
    };
});

afterEach(() => {
    vi.restoreAllMocks();
    delete supabase.auth.admin;
});

function register(overrides = {}) {
    return request(app)
        .post('/api/auth/register')
        .send({
            email: 'nouveau@studio.fr',
            password: VALID_PASSWORD,
            name: 'Studio Lumière',
            role: 'studio',
            siret: '12345678900012',
            ...overrides,
        });
}

describe('POST /api/auth/register — attribution du rôle (ANO-2026-003)', () => {
    it('écrit le rôle « studio » dans le profil quand il est demandé', async () => {
        const res = await register({ role: 'studio' });

        expect(res.status).toBe(201);
        // Cœur de l'anomalie : le rôle écrit doit être celui demandé.
        expect(profileUpserts).toHaveLength(1);
        expect(profileUpserts[0].role).toBe('studio');
    });

    it('propage le rôle « studio » jusqu’aux métadonnées du compte', async () => {
        await register({ role: 'studio' });

        // Le trigger `handle_new_user` lit ces métadonnées : si le rôle n'y est
        // pas, le profil est créé avec la valeur de repli « client ».
        const metadata = supabase.auth.admin.createUser.mock.calls[0][0].user_metadata;
        expect(metadata.role).toBe('studio');
    });

    it('écrit le rôle « client » quand il est demandé', async () => {
        await register({ role: 'client' });

        expect(profileUpserts[0].role).toBe('client');
    });

    it('ramène un rôle inconnu à « client » plutôt que de l’écrire tel quel', async () => {
        await register({ role: 'admin' });

        // Une élévation de privilège ne doit jamais pouvoir être demandée
        // depuis la charge utile d'inscription.
        expect(profileUpserts[0].role).toBe('client');
    });

    it('normalise le nom et les champs facultatifs absents', async () => {
        await register({ name: '  Studio Lumière  ', siret: undefined });

        expect(profileUpserts[0].name).toBe('Studio Lumière');
        expect(profileUpserts[0].siret).toBeNull();
    });

    it('journalise explicitement un rejet d’écriture du profil', async () => {
        // Simule la contrainte CHECK qui rejetait la valeur « studio ».
        upsertError = {
            message: 'new row for relation "profiles" violates check constraint "profiles_role_check"',
        };
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

        const res = await register({ role: 'studio' });

        // Le rejet ne doit plus être avalé silencieusement : c'est ce silence
        // qui avait rendu l'anomalie invisible jusqu'au signalement client.
        expect(consoleError).toHaveBeenCalledWith(
            'Profile upsert failed during register:',
            expect.stringContaining('profiles_role_check')
        );
        // La création du compte reste acquise côté authentification.
        expect(res.status).toBe(201);
    });
});
