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
  questionSetRef: {
    type: Schema.Types.ObjectId,
    ref: 'QuestionSet',
    required: true
  },
  // Embedded question set data
  questionSet: {
    title: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    categories: [{
      name: {
        type: String,
        trim: true
      },
      description: {
        type: String,
        trim: true
      },
      questions: [{
        title: {
          type: String,
          trim: true
        },
        description: {
          type: String,
          trim: true
        },
        points: {
          type: Number,
          min: 1
        },
        difficulty: {
          type: String,
          enum: ['easy', 'medium', 'hard']
        },
        wizProduct: {
          type: String,
          enum: ['Wiz Cloud', 'Wiz Code', 'Wiz Defend', 'Wiz Sensor']
        },
        answer: {
          type: String,
          trim: true
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
        creatorEmail: String,
        originalId: Schema.Types.ObjectId
      }]
    }]
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
    },
    displayName: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true
    },
    firstName: {
      type: String,
      trim: true
    },
    lastName: {
      type: String,
      trim: true
    },
    organization: {
      type: String,
      trim: true
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