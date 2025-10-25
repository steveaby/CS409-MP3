const asyncH = require('../middleware/async');
const { ok, created, notFound, badRequest } = require('../middleware/errors');
const { parseJSONParam } = require('../middleware/buildQuery');
const User = require('../models/user');
const { applyUserPendingTasks } = require('./helpers');

exports.list = asyncH(async (req, res) => ok(res, req.queryResult));

exports.getOne = asyncH(async (req, res) => {
  const select = parseJSONParam(req.query.select);
  const q = User.findById(req.params.id);
  if (select) q.select(select);
  const doc = await q.exec();
  if (!doc) return notFound(res, 'user not found');
  return ok(res, doc);
});

exports.create = asyncH(async (req, res) => {
  const { name, email, pendingTasks } = req.body || {};
  if (!name || !email) return badRequest(res, 'name and email are required');

  const user = new User({
    name,
    email,
    pendingTasks: Array.isArray(pendingTasks) ? pendingTasks.map(String) : []
  });
  await user.save();
  if (user.pendingTasks.length) await applyUserPendingTasks(user);
  return created(res, user);
});

exports.replace = asyncH(async (req, res) => {
  const { name, email, pendingTasks } = req.body || {};
  if (!name || !email) return badRequest(res, 'name and email are required');

  const user = await User.findById(req.params.id);
  if (!user) return notFound(res, 'user not found');

  user.name = name;
  user.email = email;
  user.pendingTasks = Array.isArray(pendingTasks) ? pendingTasks.map(String) : [];
  await user.save();
  await applyUserPendingTasks(user);
  return ok(res, user, 'Updated');
});

exports.remove = asyncH(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return notFound(res, 'user not found');

  const Task = require('../models/task');
  await Task.updateMany(
    { _id: { $in: user.pendingTasks } },
    { $set: { assignedUser: '', assignedUserName: 'unassigned' } }
  );

  await user.deleteOne();
  return ok(res, null, 'Deleted');
});
