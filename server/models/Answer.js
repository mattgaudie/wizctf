import { Schema, model } from 'mongoose';

const AnswerSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  eventId: {
    type: Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  questionId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  questionTitle: {
    type: String,
    required: true,
    trim: true
  },
  categoryName: {
    type: String,
    required: true,
    trim: true
  },
  userAnswer: {
    type: String,
    required: true,
    trim: true
  },
  isCorrect: {
    type: Boolean,
    required: true
  },
  hintUsed: {
    type: Boolean,
    default: false
  },
  pointsAwarded: {
    type: Number,
    required: true
  },
  // Required field for time series collection
  ts: {
    type: Date,
    default: Date.now,
    required: true
  }
}, { 
  // Configure time series collection 
  timeseries: {
    timeField: 'ts',
    metaField: 'userId',
    granularity: 'seconds'
  }
});

export default model('Answer', AnswerSchema, 'answers');