const asyncH = require('../middleware/async');
const { ok, created, notFound, badRequest } = require('../middleware/errors');
const { parseJSONParam } = require('../middleware/buildQuery');
const User = require('../models/user');
const Task = require('../models/task');
const { syncUserPendingForTask, isValidObjectIdString } = require('./helpers');

async function normalizeAssignee(taskDoc) {
  if (isValidObjectIdString(taskDoc.assignedUser)) {
    const u = await User.findById(taskDoc.assignedUser);
    if (!u) throw new Error('assignedUser does not exist');
    taskDoc.assignedUserName = u.name;
  } else {
    taskDoc.assignedUser = '';
    taskDoc.assignedUserName = 'unassigned';
  }
}

exports.list = asyncH(async (req, res) => ok(res, req.queryResult));

exports.getOne = asyncH(async (req, res) => {
  const select = parseJSONParam(req.query.select);
  const q = Task.findById(req.params.id);
  if (select) q.select(select);
  const doc = await q.exec();
  if (!doc) return notFound(res, 'task not found');
  return ok(res, doc);
});

exports.create = asyncH(async (req, res) => {
  const { name, description, deadline, completed, assignedUser, assignedUserName } = req.body || {};
  if (!name || !deadline) return badRequest(res, 'name and deadline are required');

  const task = new Task({
    name,
    description: description || '',
    deadline,
    completed: !!completed,
    assignedUser: assignedUser || '',
    assignedUserName: assignedUserName || 'unassigned'
  });

  const before = null;
  await normalizeAssignee(task);
  await task.save();
  await syncUserPendingForTask(before, task);
  return created(res, task);
});

exports.replace = asyncH(async (req, res) => {
  const { name, description, deadline, completed, assignedUser, assignedUserName } = req.body || {};
  if (!name || !deadline) return badRequest(res, 'name and deadline are required');

  const task = await Task.findById(req.params.id);
  if (!task) return notFound(res, 'task not found');

  const before = task.toObject();

  task.name = name;
  task.description = description || '';
  task.deadline = deadline;
  task.completed = !!completed;
  task.assignedUser = assignedUser || '';
  task.assignedUserName = assignedUserName || 'unassigned';

  await normalizeAssignee(task);
  await task.save();
  await syncUserPendingForTask(before, task);
  return ok(res, task, 'Updated');
});

exports.remove = asyncH(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return notFound(res, 'task not found');

  const before = task.toObject();
  await task.deleteOne();
  await syncUserPendingForTask(before, null);
  return ok(res, null, 'Deleted');
});
