const { randomUUID } = require('crypto');

/**
 * Identifiant de corrélation.
 *
 * Chaque requête reçoit un `requestId` unique, renvoyé au client dans l'en-tête
 * `X-Request-Id` et injecté dans chaque ligne de log de la requête.
 *
 * C'est la pièce qui rend une anomalie traçable de bout en bout :
 * l'utilisateur (ou le support) communique l'identifiant affiché par l'interface
 * → on retrouve en une requête Cloud Logging la ligne d'accès, l'erreur serveur
 * et l'événement Sentry correspondants. Sans cela, un signalement du type
 * « ça a planté vers 14 h » est très coûteux à instruire.
 *
 * Si un identifiant est déjà présent en entrée (proxy, client instrumenté),
 * il est conservé afin de ne pas casser une chaîne de corrélation existante.
 *
 * @see docs/PROCESSUS_ANOMALIES.md
 */
function requestId(req, res, next) {
    const incoming = req.get('X-Request-Id');
    req.id = incoming && incoming.length <= 128 ? incoming : randomUUID();
    res.setHeader('X-Request-Id', req.id);
    next();
}

module.exports = requestId;
