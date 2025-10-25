const router = require('express').Router();
const { handleQuery } = require('../middleware/buildQuery');
const Task = require('../models/task');
const ctrl = require('../controllers/tasks.controller');

// Tasks: default limit = 100
router.get('/', handleQuery(Task, 100), ctrl.list);
router.get('/:id', ctrl.getOne);
router.post('/', ctrl.create);
router.put('/:id', ctrl.replace);
router.delete('/:id', ctrl.remove);

module.exports = router;
