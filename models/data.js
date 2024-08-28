const mongoose = require('mongoose');
const todoItemSchema = new mongoose.Schema({
  task: String,
  TaskId: Number,
  check: Boolean
});

const userTodoSchema = new mongoose.Schema({
  userid: String,
  todoData: [todoItemSchema] // Array of todo items
});

const UserTodo = mongoose.model('UserTodo', userTodoSchema);

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String
});

const UserData = mongoose.model('UserData', userSchema);
module.exports = { UserTodo, UserData };
