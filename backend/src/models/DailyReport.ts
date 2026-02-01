import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface IDailyReport extends Document {
  date: Date;
  totalNewListings: number;
  listings: Types.ObjectId[];
  generatedAt: Date;
  sentAt: Date | null;
  recipients: string[];
  reportData: Record<string, any>;
  status: 'pending' | 'generated' | 'sent' | 'failed';
  error?: string;
}

const dailyReportSchema = new Schema<IDailyReport>({
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
    type: Schema.Types.ObjectId,
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
    type: Schema.Types.Mixed,
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

const DailyReport: Model<IDailyReport> = mongoose.model<IDailyReport>('DailyReport', dailyReportSchema);

export default DailyReport;
