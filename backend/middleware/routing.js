const User = require('../models/User');
const Node = require('../models/Node');

/**
 * findNearestActiveHandler
 * Recursively find the next parent node that has at least one active user.
 */
const findNearestActiveHandler = async (nodeId) => {
  const node = await Node.findById(nodeId);
  if (!node) return null;

  // Check if there are any users assigned to this node
  const user = await User.findOne({ node_id: nodeId, isActive: true });
  if (user) {
    return nodeId; // Found an active handler
  }

  // If no user at this node, go up to the parent
  if (node.parent_id) {
    return await findNearestActiveHandler(node.parent_id);
  }

  return null; // Reached the root and still no handler
};

module.exports = { findNearestActiveHandler };
