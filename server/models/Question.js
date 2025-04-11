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
  environment: {
    type: String,
    required: true,
    trim: true
  },
  wizProduct: {
    type: String,
    required: true,
    enum: ['Wiz Cloud', 'Wiz Code', 'Wiz Defend', 'Wiz Sensor']
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
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