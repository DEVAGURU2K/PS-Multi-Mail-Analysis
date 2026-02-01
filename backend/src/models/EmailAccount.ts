import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface IEmailAccount extends Document {
  userId: Types.ObjectId;
  email: string;
  provider: 'gmail' | 'outlook' | 'yahoo' | 'custom';
  credentials: {
    password?: string;
    oauthToken?: string;
    refreshToken?: string;
  };
  imapConfig: {
    host: string;
    port: number;
    secure: boolean;
  };
  isActive: boolean;
  lastChecked: Date | null;
  folders: string[];
  checkInterval: number;
  errorCount: number;
  lastError: string | null;
}

const emailAccountSchema = new Schema<IEmailAccount>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  provider: {
    type: String,
    enum: ['gmail', 'outlook', 'yahoo', 'custom'],
    required: true,
  },
  credentials: {
    password: {
      type: String,
      required: function(this: IEmailAccount) {
        return this.provider !== 'gmail' || !this.credentials.oauthToken;
      },
    },
    oauthToken: {
      type: String,
      required: function(this: IEmailAccount) {
        return this.provider === 'gmail' && !this.credentials.password;
      },
    },
    refreshToken: String,
  },
  imapConfig: {
    host: {
      type: String,
      required: true,
    },
    port: {
      type: Number,
      required: true,
    },
    secure: {
      type: Boolean,
      default: true,
    },
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  lastChecked: {
    type: Date,
    default: null,
  },
  folders: {
    type: [String],
    default: ['INBOX', 'Sent Items'],
  },
  checkInterval: {
    type: Number,
    default: 30, // minutes
  },
  errorCount: {
    type: Number,
    default: 0,
  },
  lastError: {
    type: String,
    default: null,
  },
}, {
  timestamps: true,
});

// Index for efficient querying
emailAccountSchema.index({ userId: 1, isActive: 1 });
emailAccountSchema.index({ email: 1 });

const EmailAccount: Model<IEmailAccount> = mongoose.model<IEmailAccount>('EmailAccount', emailAccountSchema);

export default EmailAccount;
