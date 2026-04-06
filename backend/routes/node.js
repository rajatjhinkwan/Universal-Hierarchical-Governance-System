const express = require('express');
const router = express.Router();
const Node = require('../models/Node');
const Organization = require('../models/Organization');
const { protect } = require('../middleware/auth');

// CREATE a new organization
router.post('/org', async (req, res) => {
  const { name, type } = req.body;
  try {
    const org = await Organization.create({ name, type });
    res.status(201).json(org);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ADD a node to the hierarchy
router.post('/', protect, async (req, res) => {
  const { node_id, name, parent_id, organization_id } = req.body;
  try {
    const actualParentId = parent_id === "" ? null : parent_id;

    const node = await Node.create({
      node_id,
      name,
      parent_id: actualParentId,
      organization: organization_id
    });

    if (actualParentId) {
      await Node.findByIdAndUpdate(actualParentId, {
        $push: { children: node._id }
      });
    }

    res.status(201).json(node);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// DELETE a node
router.delete('/:id', protect, async (req, res) => {
  try {
    const node = await Node.findById(req.params.id);
    if (!node) return res.status(404).json({ message: 'Node not found' });

    // Remove from parent's children array
    if (node.parent_id) {
       await Node.findByIdAndUpdate(node.parent_id, {
         $pull: { children: node._id }
       });
    }

    // Delete the node
    await Node.deleteOne({ _id: req.params.id });
    res.json({ message: 'Node removed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET the full hierarchy for an organization
router.get('/org/:orgId', protect, async (req, res) => {
  try {
     const nodes = await Node.find({ organization: req.params.orgId })
       .populate('parent_id children')
       .lean(); // Use lean for easier modification

     const User = require('../models/User');
     
     // Attach users to each node
     for (let node of nodes) {
        node.users = await User.find({ node_id: node._id }).select('name role status');
     }

     res.json(nodes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
