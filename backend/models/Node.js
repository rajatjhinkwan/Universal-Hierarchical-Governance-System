const mongoose = require('mongoose');

const NodeSchema = new mongoose.Schema({
  node_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  parent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Node', default: null },
  children: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Node' }],
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  level: { type: Number, default: 0 } // 0 for Root, increases downwards
});

module.exports = mongoose.model('Node', NodeSchema);
