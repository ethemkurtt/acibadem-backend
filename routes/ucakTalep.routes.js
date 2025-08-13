const router = require('express').Router();
const ctrl = require('../controllers/ucakTalep.controller');

router.post('/', ctrl.createTalep);
router.get('/', ctrl.getTalepler);
router.get('/:id', ctrl.getTalep);
router.put('/:id', ctrl.updateTalep);
router.delete('/:id', ctrl.deleteTalep);

module.exports = router;
