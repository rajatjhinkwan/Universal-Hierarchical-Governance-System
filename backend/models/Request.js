const mongoose = require('mongoose');

const RequestSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: {
    type: String,
    enum: ['complaint', 'suggestion', 'leave', 'other'],
    required: true
  },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  current_handler: { type: mongoose.Schema.Types.ObjectId, ref: 'Node', required: true },
  recipient_node: { type: mongoose.Schema.Types.ObjectId, ref: 'Node', required: true }, // The original target of the request
  status: {
    type: String,
    enum: ['pending', 'seen', 'in-progress', 'resolved', 'approved', 'rejected'],
    default: 'pending'
  },
  history: [
    {
      handler: { type: mongoose.Schema.Types.ObjectId, ref: 'Node' },
      action: String, // 'submitted', 'escalated', 'resolved'
      timestamp: { type: Date, default: Date.now }
    }
  ],
  isEscalated: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

RequestSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Request', RequestSchema);
