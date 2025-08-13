// routes/ticketRequest.routes.js
const router = require('express').Router();
const ctrl = require('../controllers/ticketRequest.controller');

// CRUD
router.post('/', ctrl.createTicket);
router.get('/', ctrl.listTickets);
router.get('/:id', ctrl.getTicket);
router.put('/:id', ctrl.updateTicket);
router.patch('/:id', ctrl.patchTicket);
router.delete('/:id', ctrl.deleteTicket);

module.exports = router;
