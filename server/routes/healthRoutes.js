const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Sonde de vivacité (liveness)
 *     description: >
 *       Répond sans aucune entrée/sortie. Utilisée par le HEALTHCHECK Docker,
 *       par Cloud Run et par le smoke test de la chaîne d'intégration continue.
 *     tags: [Supervision]
 *     responses:
 *       200:
 *         description: Le process répond.
 */
router.get('/health', healthController.liveness);

// Alias explicite : certaines plateformes attendent /health/live.
router.get('/health/live', healthController.liveness);

/**
 * @swagger
 * /health/ready:
 *   get:
 *     summary: Sonde d'aptitude (readiness)
 *     description: >
 *       Interroge réellement la base PostgreSQL et le stockage objet, et agrège
 *       leur état. Utilisée par l'uptime check externe et par les politiques
 *       d'alerte Cloud Monitoring.
 *     tags: [Supervision]
 *     responses:
 *       200:
 *         description: Service opérationnel (`ok`) ou dégradé (`degraded`).
 *       503:
 *         description: Dépendance critique injoignable (`down`).
 */
router.get('/health/ready', healthController.readiness);

module.exports = router;
