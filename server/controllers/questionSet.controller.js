import QuestionSet from '../models/QuestionSet.js';
import User from '../models/User.js';
import Event from '../models/Event.js';
import { validationResult } from 'express-validator';

// Get all question sets (admin only)
export async function getAllQuestionSets(req, res) {
  try {
    const questionSets = await QuestionSet.find().sort({ createdAt: -1 });
    res.json(questionSets);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
}

// Get question set by ID (admin only)
export async function getQuestionSetById(req, res) {
  try {
    const questionSet = await QuestionSet.findById(req.params.id).populate('categories.questions', 'title difficulty points wizProduct');
    
    if (!questionSet) {
      return res.status(404).json({ msg: 'Question set not found' });
    }
    
    res.json(questionSet);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Question set not found' });
    }
    res.status(500).send('Server error');
  }
}

// Create question set (admin only)
export async function createQuestionSet(req, res) {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, description, categories } = req.body;

  try {
    // Get the user's email from their ID
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Create new question set
    const newQuestionSet = new QuestionSet({
      title,
      description,
      categories: categories || [],
      createdBy: req.user.id,
      creatorEmail: user.email
    });

    // Save question set to database
    const questionSet = await newQuestionSet.save();
    
    res.json(questionSet);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
}

// Update question set (admin only)
export async function updateQuestionSet(req, res) {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, description, categories, active } = req.body;

  // Build question set object
  const questionSetFields = {};
  if (title) questionSetFields.title = title;
  if (description) questionSetFields.description = description;
  if (categories) questionSetFields.categories = categories;
  if (active !== undefined) questionSetFields.active = active;
  questionSetFields.updatedAt = Date.now();

  try {
    // Update question set
    let questionSet = await QuestionSet.findById(req.params.id);
    
    if (!questionSet) {
      return res.status(404).json({ msg: 'Question set not found' });
    }
    
    questionSet = await QuestionSet.findByIdAndUpdate(
      req.params.id,
      { $set: questionSetFields },
      { new: true }
    ).populate('categories.questions');
    
    // Update events that use this question set
    await updateEventsWithQuestionSet(questionSet);
    
    res.json(questionSet);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Question set not found' });
    }
    res.status(500).send('Server error');
  }
}

// Delete question set (admin only)
// Helper function to update events when a question set is modified
async function updateEventsWithQuestionSet(questionSet) {
  try {
    console.log(`Updating events that use question set: ${questionSet.title} (${questionSet._id})`);
    
    // Find all events using this question set
    const events = await Event.find({ questionSetRef: questionSet._id });
    console.log(`Found ${events.length} events using this question set`);
    
    for (const event of events) {
      console.log(`Updating event: ${event.name} (${event._id})`);
      
      // Create embedded version of the question set
      const embeddedQuestionSet = {
        title: questionSet.title,
        description: questionSet.description,
        categories: questionSet.categories.map(category => {
          return {
            name: category.name,
            description: category.description,
            questions: category.questions.map(question => {
              // Create embedded question with original ID reference
              return {
                title: question.title,
                description: question.description,
                points: question.points,
                difficulty: question.difficulty,
                wizProduct: question.wizProduct,
                answer: question.answer,
                hint: question.hint,
                solution: question.solution,
                creatorEmail: question.creatorEmail,
                originalId: question._id
              };
            })
          };
        })
      };
      
      // Update the event with the new embedded question set
      event.questionSet = embeddedQuestionSet;
      await event.save();
      console.log(`Successfully updated event: ${event.name}`);
    }
  } catch (err) {
    console.error('Error updating events with question set:', err);
    throw err;
  }
}

export async function deleteQuestionSet(req, res) {
  try {
    const questionSet = await QuestionSet.findById(req.params.id);
    
    if (!questionSet) {
      return res.status(404).json({ msg: 'Question set not found' });
    }
    
    // Check if any events are using this question set
    const eventsUsingSet = await Event.find({ questionSetRef: req.params.id });
    
    if (eventsUsingSet.length > 0) {
      return res.status(400).json({ 
        msg: `Cannot delete question set. It is being used by ${eventsUsingSet.length} event(s).`
      });
    }
    
    await QuestionSet.findByIdAndRemove(req.params.id);
    
    res.json({ msg: 'Question set deleted successfully' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Question set not found' });
    }
    res.status(500).send('Server error');
  }
}