const router = require('express').Router();
const { handleQuery } = require('../middleware/buildQuery');
const User = require('../models/user');
const ctrl = require('../controllers/users.controller');

router.get('/', handleQuery(User), ctrl.list);
router.get('/:id', ctrl.getOne);
router.post('/', ctrl.create);
router.put('/:id', ctrl.replace);
router.delete('/:id', ctrl.remove);

module.exports = router;
