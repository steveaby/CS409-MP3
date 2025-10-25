const mongoose = require('mongoose');
const User = require('../models/user');
const Task = require('../models/task');

const isValidObjectIdString = (s) =>
  typeof s === 'string' && mongoose.Types.ObjectId.isValid(s);

async function syncUserPendingForTask(taskBefore, taskAfter) {
  if (taskBefore) {
    const prevUserId = taskBefore.assignedUser;
    const changedUser = taskAfter && taskAfter.assignedUser !== prevUserId;
    const completedNow = taskAfter && taskAfter.completed === true;
    const deleting = !taskAfter;
    if ((changedUser || completedNow || deleting) && isValidObjectIdString(prevUserId)) {
      await User.updateOne({ _id: prevUserId }, { $pull: { pendingTasks: String(taskBefore._id) } });
    }
  }
  if (taskAfter && !taskAfter.completed && isValidObjectIdString(taskAfter.assignedUser)) {
    await User.updateOne({ _id: taskAfter.assignedUser }, { $addToSet: { pendingTasks: String(taskAfter._id) } });
  }
}

async function applyUserPendingTasks(user) {
  const userId = String(user._id);
  const keep = new Set((user.pendingTasks || []).map(String));

  if (user.pendingTasks?.length) {
    const tasks = await Task.find({ _id: { $in: Array.from(keep) } });
    await Promise.all(tasks.map(async (t) => {
      t.assignedUser = userId;
      t.assignedUserName = user.name;
      t.completed = false;
      await t.save();
    }));
  }
  
  const others = await Task.find({ assignedUser: userId, _id: { $nin: Array.from(keep) } });
  await Promise.all(others.map(async (t) => {
    t.assignedUser = '';
    t.assignedUserName = 'unassigned';
    await t.save();
  }));
}

module.exports = { isValidObjectIdString, syncUserPendingForTask, applyUserPendingTasks };
