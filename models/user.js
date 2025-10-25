// Load required packages
const mongoose = require('mongoose');

// Define our user schema
const UserSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'name is required'] },
  email: { type: String, required: [true, 'email is required'], unique: true },
  pendingTasks: [{ type: String }], // store task _ids as strings per spec
  dateCreated: { type: Date, default: Date.now }
});

// Export the Mongoose model
module.exports = mongoose.model('User', UserSchema);
