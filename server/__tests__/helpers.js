/**
 * Test helper — Mocks for Supabase and Auth middleware
 * Used by all API tests that hit protected routes
 */
const { vi } = require('vitest');

// ─── Fake user for authenticated requests ──────────────
const fakeUser = {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'test@visuals.co',
    user_metadata: { role: 'creative', name: 'Test User' },
};

// ─── Mock Supabase query builder (chainable) ───────────
function createMockQueryBuilder(resolvedData = [], resolvedError = null) {
    const builder = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
            data: resolvedData[0] || null,
            error: resolvedError,
        }),
        // Default terminal call
        then: function (resolve) {
            return resolve({ data: resolvedData, error: resolvedError, count: resolvedData.length });
        },
    };

    // Make the builder itself thenable (for await without .single())
    builder[Symbol.for('thenResolve')] = { data: resolvedData, error: resolvedError };

    // Override the default promise behavior for chained calls
    const originalSelect = builder.select;
    builder.select = vi.fn((...args) => {
        const result = originalSelect(...args);
        // If head option is passed (for count queries)
        if (args[1]?.head) {
            result.then = (resolve) => resolve({ data: null, error: resolvedError, count: resolvedData.length });
        }
        return result;
    });

    // Make terminal calls resolve properly
    const terminalResolve = () => Promise.resolve({ data: resolvedData, error: resolvedError, count: resolvedData.length });
    builder.order = vi.fn(() => {
        const ordered = { ...builder, then: (resolve) => resolve({ data: resolvedData, error: resolvedError }) };
        ordered.limit = vi.fn(() => ({ then: (resolve) => resolve({ data: resolvedData, error: resolvedError }) }));
        return ordered;
    });

    return builder;
}

// ─── Create a mock Supabase client ─────────────────────
function createMockSupabase(mockData = {}) {
    const tableBuilders = {};

    return {
        from: vi.fn((table) => {
            if (tableBuilders[table]) return tableBuilders[table];
            return createMockQueryBuilder(mockData[table] || []);
        }),
        auth: {
            getUser: vi.fn().mockResolvedValue({
                data: { user: fakeUser },
                error: null,
            }),
        },
        _setTableData: (table, data, error = null) => {
            tableBuilders[table] = createMockQueryBuilder(data, error);
        },
    };
}

module.exports = { fakeUser, createMockQueryBuilder, createMockSupabase };
