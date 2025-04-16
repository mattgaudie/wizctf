import Event from '../models/Event.js';
import User from '../models/User.js';
import QuestionSet from '../models/QuestionSet.js';
import { validationResult } from 'express-validator';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get events for the authenticated user
export async function getUserEvents(req, res) {
  try {
    // Find events where the user is a participant
    const events = await Event.find({
      'participants.user': req.user.id
    })
    .populate('questionSet', 'title')
    .sort({ eventDate: -1 });
    
    res.json(events);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
}

// Get all events (admin only)
export async function getAllEvents(req, res) {
  try {
    const events = await Event.find()
      .populate('questionSet', 'title')
      .sort({ eventDate: -1 });
    res.json(events);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
}

// Get all active events (for regular users)
export async function getActiveEvents(req, res) {
  try {
    // Get only active events
    const events = await Event.find({ active: true })
      .populate('questionSet', 'title')
      .sort({ eventDate: -1 });
    
    res.json(events);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
}

// Get event by ID (admin or participant)
export async function getEventById(req, res) {
  try {
    const event = await Event.findById(req.params.id)
      .populate('questionSet', 'title categories')
      .populate('participants.user', 'email firstName lastName organization');
    
    if (!event) {
      return res.status(404).json({ msg: 'Event not found' });
    }
    
    // Check if user is admin or participant in this event
    const isAdmin = req.user.role === 'admin';
    const isParticipant = event.participants.some(p => p.user._id.toString() === req.user.id);
    
    if (!isAdmin && !isParticipant) {
      return res.status(403).json({ msg: 'Access denied' });
    }
    
    res.json(event);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Event not found' });
    }
    res.status(500).send('Server error');
  }
}

// Create event (admin only)
export async function createEvent(req, res) {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { 
    name, 
    description, 
    questionSet: questionSetId, 
    eventCode, 
    eventDate, 
    duration, 
    active 
  } = req.body;

  try {
    // Check if event code already exists
    const existingEvent = await Event.findOne({ eventCode });
    if (existingEvent) {
      return res.status(400).json({ msg: 'Event code already in use' });
    }

    // Get the user's email from their ID
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Fetch the complete question set with all questions
    const fullQuestionSet = await QuestionSet.findById(questionSetId)
      .populate({
        path: 'categories.questions',
        model: 'Question'
      });
    
    if (!fullQuestionSet) {
      return res.status(404).json({ msg: 'Question set not found' });
    }
    
    // Prepare embedded question set data
    const embeddedQuestionSet = {
      title: fullQuestionSet.title,
      description: fullQuestionSet.description,
      categories: fullQuestionSet.categories.map(category => {
        // For each category, get its questions
        const populatedQuestions = category.questions.map(question => {
          // For each question, extract relevant data
          return {
            title: question.title,
            description: question.description,
            points: question.points,
            difficulty: question.difficulty,
            wizProduct: question.wizProduct,
            answer: question.answer,
            creatorEmail: question.creatorEmail,
            originalId: question._id
          };
        });
        
        // Return embedded category with embedded questions
        return {
          name: category.name,
          description: category.description,
          questions: populatedQuestions
        };
      })
    };
    
    // Create new event with embedded question set data
    const newEvent = new Event({
      name,
      description,
      questionSetRef: questionSetId,
      questionSet: embeddedQuestionSet,
      eventCode,
      eventDate,
      duration: duration || 60,
      active: active !== undefined ? active : true,
      createdBy: req.user.id,
      creatorEmail: user.email
    });

    // Handle image upload if it exists
    if (req.file) {
      newEvent.imagePath = `/uploads/events/${req.file.filename}`;
    }

    // Save event to database
    const event = await newEvent.save();
    
    res.json(event);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
}

// Update event (admin only)
export async function updateEvent(req, res) {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { 
    name, 
    description, 
    questionSet: questionSetId, 
    eventCode, 
    eventDate, 
    duration, 
    active 
  } = req.body;

  try {
    // Check if event exists
    let event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ msg: 'Event not found' });
    }

    // Check if the new event code conflicts with another event
    if (eventCode && eventCode !== event.eventCode) {
      const existingEvent = await Event.findOne({ 
        eventCode, 
        _id: { $ne: req.params.id } 
      });
      
      if (existingEvent) {
        return res.status(400).json({ msg: 'Event code already in use' });
      }
    }

    // Build event object
    const eventFields = {};
    if (name) eventFields.name = name;
    if (description !== undefined) eventFields.description = description;
    if (eventCode) eventFields.eventCode = eventCode;
    if (eventDate) eventFields.eventDate = eventDate;
    if (duration) eventFields.duration = duration;
    if (active !== undefined) eventFields.active = active;
    eventFields.updatedAt = Date.now();
    
    // If question set has changed, update embedded data
    if (questionSetId && questionSetId !== event.questionSetRef.toString()) {
      // Fetch the new question set with all questions
      const fullQuestionSet = await QuestionSet.findById(questionSetId)
        .populate({
          path: 'categories.questions',
          model: 'Question'
        });
      
      if (!fullQuestionSet) {
        return res.status(404).json({ msg: 'Question set not found' });
      }
      
      // Prepare embedded question set data
      const embeddedQuestionSet = {
        title: fullQuestionSet.title,
        description: fullQuestionSet.description,
        categories: fullQuestionSet.categories.map(category => {
          // For each category, get its questions
          const populatedQuestions = category.questions.map(question => {
            // For each question, extract relevant data
            return {
              title: question.title,
              description: question.description,
              points: question.points,
              difficulty: question.difficulty,
              wizProduct: question.wizProduct,
              answer: question.answer,
              creatorEmail: question.creatorEmail,
              originalId: question._id
            };
          });
          
          // Return embedded category with embedded questions
          return {
            name: category.name,
            description: category.description,
            questions: populatedQuestions
          };
        })
      };
      
      eventFields.questionSetRef = questionSetId;
      eventFields.questionSet = embeddedQuestionSet;
    }

    // Handle image upload if it exists
    if (req.file) {
      // Delete old image if it exists
      if (event.imagePath) {
        try {
          const oldImagePath = path.join(__dirname, '..', event.imagePath);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        } catch (err) {
          console.error('Error deleting old image:', err);
        }
      }

      eventFields.imagePath = `/uploads/events/${req.file.filename}`;
    }

    // Update event
    event = await Event.findByIdAndUpdate(
      req.params.id,
      { $set: eventFields },
      { new: true }
    ).populate('questionSet', 'title');
    
    res.json(event);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Event not found' });
    }
    res.status(500).send('Server error');
  }
}

// Delete event (admin only)
export async function deleteEvent(req, res) {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ msg: 'Event not found' });
    }
    
    // Delete event image if it exists
    if (event.imagePath) {
      try {
        const imagePath = path.join(__dirname, '..', event.imagePath);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      } catch (err) {
        console.error('Error deleting image:', err);
      }
    }
    
    await Event.findByIdAndRemove(req.params.id);
    
    res.json({ msg: 'Event deleted successfully' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Event not found' });
    }
    res.status(500).send('Server error');
  }
}

// Add participant to event (for users)
export async function joinEvent(req, res) {
  const { eventCode } = req.body;

  try {
    // Find event by code
    const event = await Event.findOne({ eventCode, active: true });
    
    if (!event) {
      return res.status(404).json({ msg: 'Invalid event code or event is not active' });
    }
    
    // Check if event date has passed
    const now = new Date();
    if (new Date(event.eventDate) < now) {
      return res.status(400).json({ msg: 'This event has already ended' });
    }
    
    // Check if user is already a participant
    const alreadyJoined = event.participants.some(
      p => p.user.toString() === req.user.id
    );
    
    if (alreadyJoined) {
      return res.status(400).json({ msg: 'You have already joined this event' });
    }
    
    // Get user details
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Use user's displayName if available, or generate one
    const displayName = user.displayName || 
      (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email.split('@')[0]);
    
    // Add user to participants with additional details
    event.participants.push({
      user: req.user.id,
      joinedAt: Date.now(),
      displayName,
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      organization: user.organization || ''
    });
    
    await event.save();
    
    res.json({ msg: 'Successfully joined the event', event: { id: event._id, name: event.name } });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
}

// Get participants for an event (admin only)
export async function getEventParticipants(req, res) {
  try {
    const event = await Event.findById(req.params.id)
      .populate('participants.user', 'email firstName lastName profilePicture organization');
    
    if (!event) {
      return res.status(404).json({ msg: 'Event not found' });
    }
    
    res.json(event.participants);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Event not found' });
    }
    res.status(500).send('Server error');
  }
}

// Check an answer for a question
export async function checkAnswer(req, res) {
  const { answer } = req.body;
  const { eventId, questionId } = req.params;
  
  if (!answer) {
    return res.status(400).json({ msg: 'Answer is required' });
  }
  
  try {
    // Find the event
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({ msg: 'Event not found' });
    }
    
    // Check if the user is a participant in this event
    const isParticipant = event.participants.some(
      p => p.user.toString() === req.user.id
    );
    
    if (!isParticipant) {
      return res.status(403).json({ msg: 'You must join this event before submitting answers' });
    }
    
    // Find the question in the embedded data
    let foundQuestion = null;
    let foundCategory = null;
    
    // Search through all categories and their questions
    for (const category of event.questionSet.categories) {
      for (const question of category.questions) {
        // Use either originalId or _id to match
        const questionIdToCheck = question.originalId ? 
          question.originalId.toString() : 
          question._id.toString();
        
        if (questionIdToCheck === questionId) {
          foundQuestion = question;
          foundCategory = category;
          break;
        }
      }
      
      if (foundQuestion) break;
    }
    
    if (!foundQuestion) {
      return res.status(404).json({ msg: 'Question not found' });
    }
    
    // Check if answer is correct (case insensitive comparison)
    const isCorrect = 
      answer.toLowerCase().trim() === foundQuestion.answer.toLowerCase().trim();
    
    // Return result
    res.json({
      correct: isCorrect,
      points: isCorrect ? foundQuestion.points : 0,
      category: foundCategory ? foundCategory.name : null
    });
    
  } catch (err) {
    console.error('Error checking answer:', err);
    res.status(500).send('Server error');
  }
}