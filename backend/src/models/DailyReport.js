const mongoose = require('mongoose');

const dailyReportSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true,
    index: true,
  },
  totalNewListings: {
    type: Number,
    default: 0,
  },
  listings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PropertyListing',
  }],
  generatedAt: {
    type: Date,
    default: Date.now,
  },
  sentAt: {
    type: Date,
    default: null,
  },
  recipients: [String],
  reportData: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  status: {
    type: String,
    enum: ['pending', 'generated', 'sent', 'failed'],
    default: 'pending',
  },
  error: {
    type: String,
    default: null,
  },
}, {
  timestamps: true,
});

// Index for efficient querying
dailyReportSchema.index({ date: -1 });
dailyReportSchema.index({ status: 1 });

module.exports = mongoose.model('DailyReport', dailyReportSchema);
