import mongoose, { Document, Schema, Model, Types } from 'mongoose';
import crypto from 'crypto';

export interface IPropertyListing extends Document {
  sourceUrl: string;
  emailAccountId: Types.ObjectId;
  emailId: Types.ObjectId;
  bhk?: number;
  unitType?: 'Apartment' | 'House' | 'Villa' | 'Studio' | 'Penthouse' | 'Other';
  size?: {
    value: number;
    unit: 'sqft' | 'sqm';
  };
  rent?: {
    value: number;
    currency: string;
    period: 'month' | 'year';
  };
  address: {
    full: string;
    city?: string;
    state?: string;
    pincode?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  scrapedData: Record<string, any>;
  extractedAt: Date;
  isDuplicate: boolean;
  duplicateOf?: Types.ObjectId;
  uniqueIdentifier?: string;
  status: 'new' | 'processed' | 'archived';
}

const propertyListingSchema = new Schema<IPropertyListing>({
  sourceUrl: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  emailAccountId: {
    type: Schema.Types.ObjectId,
    ref: 'EmailAccount',
    required: true,
    index: true,
  },
  emailId: {
    type: Schema.Types.ObjectId,
    ref: 'ProcessedEmail',
    required: true,
  },
  bhk: {
    type: Number,
    min: 0,
    index: true,
  },
  unitType: {
    type: String,
    enum: ['Apartment', 'House', 'Villa', 'Studio', 'Penthouse', 'Other'],
    index: true,
  },
  size: {
    value: {
      type: Number,
      min: 0,
    },
    unit: {
      type: String,
      enum: ['sqft', 'sqm'],
    },
  },
  rent: {
    value: {
      type: Number,
      min: 0,
      index: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    period: {
      type: String,
      enum: ['month', 'year'],
      default: 'month',
    },
  },
  address: {
    full: {
      type: String,
      required: true,
      index: 'text',
    },
    city: {
      type: String,
      index: true,
    },
    state: {
      type: String,
    },
    pincode: {
      type: String,
    },
    coordinates: {
      lat: Number,
      lng: Number,
    },
  },
  scrapedData: {
    type: Schema.Types.Mixed,
    default: {},
  },
  extractedAt: {
    type: Date,
    default: Date.now,
  },
  isDuplicate: {
    type: Boolean,
    default: false,
    index: true,
  },
  duplicateOf: {
    type: Schema.Types.ObjectId,
    ref: 'PropertyListing',
    default: null,
  },
  uniqueIdentifier: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['new', 'processed', 'archived'],
    default: 'new',
    index: true,
  },
}, {
  timestamps: true,
});

// Generate unique identifier before saving
propertyListingSchema.pre('save', function(next) {
  if (!this.uniqueIdentifier && this.address.full) {
    const hashInput = `${this.sourceUrl}-${this.address.full}`;
    this.uniqueIdentifier = crypto.createHash('sha256').update(hashInput).digest('hex');
  }
  next();
});

// Indexes for efficient querying
propertyListingSchema.index({ emailAccountId: 1, createdAt: -1 });
propertyListingSchema.index({ createdAt: -1 });
propertyListingSchema.index({ status: 1, createdAt: -1 });
propertyListingSchema.index({ 'address.city': 1, bhk: 1, 'rent.value': 1 });

const PropertyListing: Model<IPropertyListing> = mongoose.model<IPropertyListing>('PropertyListing', propertyListingSchema);

export default PropertyListing;
