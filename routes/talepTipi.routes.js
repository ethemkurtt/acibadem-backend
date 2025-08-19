const router = require('express').Router();
const c = require('../controllers/talepTipi.controller');

// Talep tipi ekleme
router.post('/', c.createTalepTipi);

// (opsiyonel) detay
router.get('/:id', c.getTalepTipi);

// Alt tür ekleme
router.post('/:id/alt-turler', c.addAltTur);

module.exports = router;
