const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const User = require('../models/User');
const Node = require('../models/Node');
const { protect } = require('../middleware/auth');

// CREATE a new task (Downward delegation)
router.post('/', protect, async (req, res) => {
  const { title, description, assigned_to_node, dueDate } = req.body;

  try {
    const parentNodeId = req.user.node_id;
    const task = await Task.create({
      title,
      description,
      assigned_to: assigned_to_node,
      created_by: req.user._id,
      dueDate
    });

    // Notify the target room (node)
    const io = req.app.get('socketio');
    io.to(assigned_to_node.toString()).emit('newTask', task);

    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET tasks for the current user's node
router.get('/my-tasks', protect, async (req, res) => {
  try {
    const tasks = await Task.find({ assigned_to: req.user.node_id }).sort({ dueDate: 1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// UPDATE progress (Upward tracking)
router.put('/:id/progress', protect, async (req, res) => {
  const { progress } = req.body;
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    task.progress = progress;
    if (progress === 100) task.status = 'completed';
    await task.save();

    const io = req.app.get('socketio');
    io.emit('taskProgressUpdate', task);

    res.json(task);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
