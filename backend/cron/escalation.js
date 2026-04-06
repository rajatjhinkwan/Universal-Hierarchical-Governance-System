const cron = require('node-cron');
const Request = require('../models/Request');
const Node = require('../models/Node');
const { findNearestActiveHandler } = require('../middleware/routing');

const setupEscalationCron = (io) => {
  // Runs every hour
  cron.schedule('0 * * * *', async () => {
    console.log('Running Escalation Engine...');
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    try {
      const pendingRequests = await Request.find({
        status: 'pending',
        updatedAt: { $lt: threeDaysAgo }
      }).populate('current_handler');

      for (const req of pendingRequests) {
        const currentHandlerNode = req.current_handler;
        if (currentHandlerNode && currentHandlerNode.parent_id) {
          // Find next parent with an active handler
          const nextNodeId = await findNearestActiveHandler(currentHandlerNode.parent_id);

          if (nextNodeId && nextNodeId.toString() !== currentHandlerNode._id.toString()) {
            req.current_handler = nextNodeId;
            req.isEscalated = true;
            req.history.push({
              handler: nextNodeId,
              action: `Auto-escalated due to inactivity at ${currentHandlerNode.name}`
            });
            await req.save();

            // Notify new handler
            io.to(nextNodeId.toString()).emit('requestEscalated', req);
            console.log(`Request ${req._id} escalated to ${nextNodeId}`);
          }
        }
      }
    } catch (err) {
      console.error('Escalation Cron Error:', err);
    }
  });
};

module.exports = setupEscalationCron;
