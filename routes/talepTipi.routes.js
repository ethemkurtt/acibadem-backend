const router = require('express').Router();
const c = require('../controllers/talepTipi.controller');

// Talep Tipi
router.get('/', c.listTalepTipleri);                 // Tümü + filtre
router.get('/:id', c.getTalepTipi);                  // Tekil (altTürler dahil)
router.post('/', c.createTalepTipi);                 // Ekle
router.patch('/:id', c.updateTalepTipi);             // Güncelle
router.delete('/:id', c.removeTalepTipi);            // Sil

// Alt Tür
router.post('/:id/alt-turler', c.addAltTur);                     // Alt tür ekle
router.patch('/:id/alt-turler/:altId', c.updateAltTur);          // Alt tür güncelle
router.delete('/:id/alt-turler/:altId', c.removeAltTur);         // Alt tür sil

module.exports = router;
