import { Schema, model } from 'mongoose';

const QuestionSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  points: {
    type: Number,
    required: true,
    min: 1
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['easy', 'medium', 'hard']
  },
  wizProduct: {
    type: String,
    required: true,
    enum: ['Wiz Cloud', 'Wiz Code', 'Wiz Defend', 'Wiz Sensor']
  },
  // New hint field
  hint: {
    text: {
      type: String,
      trim: true,
      default: ''
    },
    pointReduction: {
      type: Number,
      default: 10,
      min: 0,
      max: 100
    },
    // Whether the reduction is a percentage or static value
    reductionType: {
      type: String,
      enum: ['percentage', 'static'],
      default: 'percentage'
    }
  },
  // New solution field (admin only)
  solution: {
    description: {
      type: String,
      trim: true,
      default: ''
    },
    url: {
      type: String,
      trim: true,
      default: ''
    }
  },
  answer: {
    type: String,
    required: true,
    trim: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  creatorEmail: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  active: {
    type: Boolean,
    default: true
  }
});

// Update the updatedAt field on save
QuestionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default model('Question', QuestionSchema, 'questions');