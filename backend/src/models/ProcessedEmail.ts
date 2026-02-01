import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface IProcessedEmail extends Document {
  emailAccountId: Types.ObjectId;
  messageId: string;
  subject: string;
  from: string;
  to: string;
  date: Date;
  body: {
    html?: string;
    text?: string;
  };
  links: string[];
  propertyLinks: string[];
  isProcessed: boolean;
  processedAt: Date | null;
  error?: string;
}

const processedEmailSchema = new Schema<IProcessedEmail>({
  emailAccountId: {
    type: Schema.Types.ObjectId,
    ref: 'EmailAccount',
    required: true,
    index: true,
  },
  messageId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  subject: {
    type: String,
    required: true,
  },
  from: {
    type: String,
    required: true,
  },
  to: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  body: {
    html: String,
    text: String,
  },
  links: [String],
  propertyLinks: [String],
  isProcessed: {
    type: Boolean,
    default: false,
    index: true,
  },
  processedAt: {
    type: Date,
    default: null,
  },
  error: {
    type: String,
    default: null,
  },
}, {
  timestamps: true,
});

// Indexes for efficient querying
processedEmailSchema.index({ emailAccountId: 1, isProcessed: 1 });
processedEmailSchema.index({ date: -1 });
processedEmailSchema.index({ propertyLinks: 1 });

const ProcessedEmail: Model<IProcessedEmail> = mongoose.model<IProcessedEmail>('ProcessedEmail', processedEmailSchema);

export default ProcessedEmail;
