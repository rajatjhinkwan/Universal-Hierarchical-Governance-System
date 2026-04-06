const express = require('express');
const router = express.Router();
const Request = require('../models/Request');
const User = require('../models/User');
const Node = require('../models/Node');
const { protect } = require('../middleware/auth');
const { findNearestActiveHandler } = require('../middleware/routing');

// CREATE a new request (Complaint, Leave, Suggestion)
router.post('/', protect, async (req, res) => {
  const { title, description, type } = req.body;
  const user = await User.findById(req.user._id).populate('node_id');
  if (!user || !user.node_id) {
    return res.status(400).json({ message: 'User is not assigned to a node' });
  }

  try {
    const parentNodeId = user.node_id.parent_id;
    if (!parentNodeId) {
      return res.status(400).json({ message: 'User is at the top level, nowhere to send request' });
    }

    // Step 8: Vacancy Handling - logic to skip empty nodes
    const activeHandlerNodeId = await findNearestActiveHandler(parentNodeId);

    if (!activeHandlerNodeId) {
      return res.status(400).json({ message: 'No active handlers available in the hierarchy' });
    }

    const newRequest = await Request.create({
      title,
      description,
      type,
      sender: req.user._id,
      current_handler: activeHandlerNodeId,
      recipient_node: activeHandlerNodeId,
      history: [{ handler: activeHandlerNodeId, action: 'submitted' }]
    });

    // Notify the target room (node)
    const io = req.app.get('socketio');
    io.to(activeHandlerNodeId.toString()).emit('newRequest', newRequest);

    res.status(201).json(newRequest);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET requests for the current user's node
router.get('/my-inbox', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.node_id) {
      return res.status(400).json({ message: 'User not assigned to a node' });
    }

    const requests = await Request.find({ current_handler: user.node_id })
      .populate('sender', 'name email role')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// RESOLVE/ACTION on a request
router.put('/:id/action', protect, async (req, res) => {
   const { status, action } = req.body;
   try {
     const request = await Request.findById(req.params.id);
     if (!request) return res.status(404).json({ message: 'Request not found' });

     request.status = status;
     request.history.push({ handler: request.current_handler, action: action });
     await request.save();

     const io = req.app.get('socketio');
     io.emit('requestUpdated', request); // Notify relevant parts

     res.json(request);
   } catch (err) {
     res.status(500).json({ message: 'Server error' });
   }
});

module.exports = router;
