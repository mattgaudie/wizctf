import { Schema, model } from 'mongoose';

const EventSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  questionSet: {
    type: Schema.Types.ObjectId,
    ref: 'QuestionSet',
    required: true
  },
  eventCode: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  eventDate: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // duration in minutes
    required: true,
    default: 60
  },
  imagePath: {
    type: String,
    default: ''
  },
  participants: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  active: {
    type: Boolean,
    default: true
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
  }
});

// Update the updatedAt field on save
EventSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default model('Event', EventSchema, 'events');