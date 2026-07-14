// Reusable pagination helpers (mitigates risk R5 — performance with large datasets).
//
// Backward-compatible by design: endpoints keep returning a plain array when the
// caller sends no `page`/`limit` query. When pagination is requested, they return
// an envelope `{ data, pagination }` with total count and page metadata.

/**
 * Parse `?page` / `?limit` into a Supabase `.range()` window.
 * @param {object} query - Express req.query
 * @param {{ defaultLimit?: number, maxLimit?: number }} [opts]
 */
function getPaginationParams(query, { defaultLimit = 20, maxLimit = 100 } = {}) {
    const hasPagination = query.page !== undefined || query.limit !== undefined;
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    return { hasPagination, page, limit, from, to };
}

/**
 * Shape the response: legacy array, or paginated envelope with metadata.
 */
function buildPaginatedResponse(data, count, { page, limit, hasPagination }) {
    if (!hasPagination) return data;
    return {
        data,
        pagination: {
            page,
            limit,
            total: count ?? null,
            totalPages: count === null || count === undefined ? null : Math.ceil(count / limit),
        },
    };
}

module.exports = { getPaginationParams, buildPaginatedResponse };
