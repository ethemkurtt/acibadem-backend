const router = require('express').Router();
const ctrl = require('../controllers/digerUlasim.controller');

router.post('/',     ctrl.createTalep);
router.get('/',      ctrl.listTalepler);
router.get('/:id',   ctrl.getTalep);
router.put('/:id',   ctrl.updateTalep);
router.patch('/:id', ctrl.patchTalep);
router.delete('/:id',ctrl.deleteTalep);

module.exports = router;
