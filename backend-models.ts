// backend/src/models/User.ts
import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Define the subscription plan types
export enum SubscriptionPlanType {
  PRO = 'pro',
  PLUS = 'plus',
  PLATINUM = 'platinum',
  AGENCY = 'agency'
}

// Interface representing subscription plan
export interface ISubscriptionPlan {
  type: SubscriptionPlanType;
  monthlyCredits: number;
  isLifetime: boolean;
  purchasedAt: Date;
  expiresAt?: Date;
}

// Interface for WordPress site connection
export interface IWordPressSite {
  name: string;
  url: string;
  username: string;
  password: string; // This will be encrypted
  apiKey?: string;
}

// Interface for User document extending Mongoose Document
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  credits: number;
  reservedCredits: number;
  subscriptionPlan: ISubscriptionPlan;
  wordpressSites: IWordPressSite[];
  refreshToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  matchPassword(enteredPassword: string): Promise<boolean>;
  getSignedJwtToken(): string;
  getResetPasswordToken(): string;
}

// Create User Schema
const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true,
      maxlength: [50, 'Name cannot be more than 50 characters']
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email'
      ]
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false // Don't return password in queries
    },
    credits: {
      type: Number,
      default: 0
    },
    reservedCredits: {
      type: Number,
      default: 0
    },
    subscriptionPlan: {
      type: {
        type: String,
        enum: Object.values(SubscriptionPlanType),
        default: SubscriptionPlanType.PRO
      },
      monthlyCredits: {
        type: Number,
        default: 100000 // Default to PRO plan (100,000 credits)
      },
      isLifetime: {
        type: Boolean,
        default: true
      },
      purchasedAt: {
        type: Date,
        default: Date.now
      },
      expiresAt: {
        type: Date
      }
    },
    wordpressSites: [
      {
        name: {
          type: String,
          required: true
        },
        url: {
          type: String,
          required: true
        },
        username: {
          type: String,
          required: true
        },
        password: {
          type: String,
          required: true
        },
        apiKey: String
      }
    ],
    refreshToken: String,
    resetPasswordToken: String,
    resetPasswordExpire: Date
  },
  {
    timestamps: true
  }
);

// Encrypt password using bcrypt before saving
UserSchema.pre<IUser>('save', async function (next) {
  // Only hash password if it's modified (or new)
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Encrypt WordPress site passwords
UserSchema.pre<IUser>('save', async function (next) {
  try {
    // Check if WordPress sites exist and have been modified
    if (this.wordpressSites && this.isModified('wordpressSites')) {
      for (let i = 0; i < this.wordpressSites.length; i++) {
        const site = this.wordpressSites[i];
        
        // Only encrypt if the password has been modified
        if (site.password && !site.password.startsWith('$2a$')) {
          const salt = await bcrypt.genSalt(10);
          this.wordpressSites[i].password = await bcrypt.hash(site.password, salt);
        }
      }
    }
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function (): string {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_SECRET || 'secretkey',
    {
      expiresIn: process.env.JWT_EXPIRE || '30d'
    }
  );
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword: string): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
UserSchema.methods.getResetPasswordToken = function (): string {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

// Create and export User model
const User = mongoose.model<IUser>('User', UserSchema);
export default User;

// backend/src/models/CreditTransaction.ts
import mongoose, { Schema, Document } from 'mongoose';

// Define the transaction types
export enum TransactionType {
  PURCHASE = 'purchase',
  USAGE = 'usage', 
  SUBSCRIPTION_RENEWAL = 'subscription_renewal',
  ADJUSTMENT = 'adjustment',
  REFUND = 'refund'
}

// Define the features for usage tracking
export enum Feature {
  AI_WRITER = 'ai_writer',
  AUTO_WRITER = 'auto_writer',
  LONG_FORM_WRITER = 'long_form_writer',
  IMAGE_GENERATION = 'image_generation'
}

// Interface for Credit Transaction document
export interface ICreditTransaction extends Document {
  user: mongoose.Types.ObjectId;
  amount: number;
  type: TransactionType;
  feature?: Feature;
  description: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

// Create Credit Transaction Schema
const CreditTransactionSchema = new Schema<ICreditTransaction>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    type: {
      type: String,
      enum: Object.values(TransactionType),
      required: true
    },
    feature: {
      type: String,
      enum: Object.values(Feature)
    },
    description: {
      type: String,
      required: true
    },
    metadata: {
      type: Schema.Types.Mixed
    }
  },
  {
    timestamps: true
  }
);

// Create and export Credit Transaction model
const CreditTransaction = mongoose.model<ICreditTransaction>('CreditTransaction', CreditTransactionSchema);
export default CreditTransaction;

// backend/src/models/Article.ts
import mongoose, { Schema, Document } from 'mongoose';

// Define article status
export enum ArticleStatus {
  DRAFT = 'draft',
  COMPLETED = 'completed',
  PUBLISHED = 'published',
  FAILED = 'failed'
}

// Interface for image in article
export interface IArticleImage {
  url: string;
  alt: string;
  position: string; // "featured", "beginning", "middle", "end"
  caption?: string;
}

// Interface for article config
export interface IArticleConfig {
  style: string; // "informative", "guide", "listicle", etc.
  language: string;
  length: string; // "short", "medium", "long"
  pointOfView: string; // "first", "second", "third"
  tone: string; // "informative", "friendly", "scientific", etc.
  boldText: boolean;
  takeaways: number;
  faqItems: number;
  photoStyle: string;
  externalLinks: boolean;
  internalLinks: boolean;
}

// Interface for Article document
export interface IArticle extends Document {
  user: mongoose.Types.ObjectId;
  jobId?: string; // For bulk generation jobs
  title: string;
  content: string;
  status: ArticleStatus;
  wordCount: number;
  images: IArticleImage[];
  config: IArticleConfig;
  seoTitle?: string;
  seoDescription?: string;
  externalLinks?: string[];
  internalLinks?: string[];
  publishedUrl?: string;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Create Article Schema
const ArticleSchema = new Schema<IArticle>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    jobId: {
      type: String
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    content: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: Object.values(ArticleStatus),
      default: ArticleStatus.DRAFT
    },
    wordCount: {
      type: Number,
      required: true
    },
    images: [
      {
        url: {
          type: String,
          required: true
        },
        alt: {
          type: String,
          required: true
        },
        position: {
          type: String,
          required: true
        },
        caption: String
      }
    ],
    config: {
      style: {
        type: String,
        required: true
      },
      language: {
        type: String,
        required: true,
        default: 'English'
      },
      length: {
        type: String,
        required: true
      },
      pointOfView: {
        type: String,
        required: true
      },
      tone: {
        type: String,
        required: true
      },
      boldText: {
        type: Boolean,
        default: true
      },
      takeaways: {
        type: Number,
        default: 0
      },
      faqItems: {
        type: Number,
        default: 0
      },
      photoStyle: {
        type: String
      },
      externalLinks: {
        type: Boolean,
        default: true
      },
      internalLinks: {
        type: Boolean,
        default: true
      }
    },
    seoTitle: String,
    seoDescription: String,
    externalLinks: [String],
    internalLinks: [String],
    publishedUrl: String,
    publishedAt: Date
  },
  {
    timestamps: true
  }
);

// Create full text index for search
ArticleSchema.index(
  { title: 'text', content: 'text' },
  { weights: { title: 10, content: 1 } }
);

// Create and export Article model
const Article = mongoose.model<IArticle>('Article', ArticleSchema);
export default Article;

// backend/src/models/GenerationJob.ts
import mongoose, { Schema, Document } from 'mongoose';

// Define job status
export enum JobStatus {
  QUEUED = 'queued',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// Interface for Generation Job document
export interface IGenerationJob extends Document {
  user: mongoose.Types.ObjectId;
  jobId: string;
  status: JobStatus;
  type: string; // "bulk", "single", etc.
  progress: number; // 0-100
  titles: string[];
  completedTitles: string[];
  config: Record<string, any>;
  estimatedCredits: number;
  actualCredits: number;
  errorMessage?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Create Generation Job Schema
const GenerationJobSchema = new Schema<IGenerationJob>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    jobId: {
      type: String,
      required: true,
      unique: true
    },
    status: {
      type: String,
      enum: Object.values(JobStatus),
      default: JobStatus.QUEUED
    },
    type: {
      type: String,
      required: true
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    titles: [String],
    completedTitles: [String],
    config: {
      type: Schema.Types.Mixed,
      required: true
    },
    estimatedCredits: {
      type: Number,
      required: true
    },
    actualCredits: {
      type: Number,
      default: 0
    },
    errorMessage: String,
    startedAt: Date,
    completedAt: Date
  },
  {
    timestamps: true
  }
);

// Create and export Generation Job model
const GenerationJob = mongoose.model<IGenerationJob>('GenerationJob', GenerationJobSchema);
export default GenerationJob;
