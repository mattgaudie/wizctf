import Question from '../models/Question.js';
import User from '../models/User.js';
import Event from '../models/Event.js';
import { validationResult } from 'express-validator';

// Get all questions (admin only)
export async function getAllQuestions(req, res) {
  try {
    const questions = await Question.find().sort({ createdAt: -1 });
    res.json(questions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
}

// Get question by ID (admin only)
export async function getQuestionById(req, res) {
  try {
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({ msg: 'Question not found' });
    }
    
    res.json(question);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Question not found' });
    }
    res.status(500).send('Server error');
  }
}

// Create question (admin only)
export async function createQuestion(req, res) {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { 
    title, 
    description, 
    points, 
    difficulty, 
    wizProduct, 
    answer,
    hint,
    solution
  } = req.body;

  try {
    // Get the user's email from their ID
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Create new question
    const newQuestion = new Question({
      title,
      description,
      points,
      difficulty,
      wizProduct,
      answer,
      hint: {
        text: hint?.text || '',
        pointReduction: hint?.pointReduction || 10,
        reductionType: hint?.reductionType || 'percentage'
      },
      solution: {
        description: solution?.description || '',
        url: solution?.url || ''
      },
      createdBy: req.user.id,
      creatorEmail: user.email
    });

    // Save question to database
    const question = await newQuestion.save();
    
    res.json(question);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
}

// Update question (admin only)
export async function updateQuestion(req, res) {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { 
    title, 
    description, 
    points, 
    difficulty, 
    wizProduct, 
    answer, 
    active,
    hint,
    solution
  } = req.body;

  // Build question object
  const questionFields = {};
  if (title) questionFields.title = title;
  if (description) questionFields.description = description;
  if (points) questionFields.points = points;
  if (difficulty) questionFields.difficulty = difficulty;
  if (wizProduct) questionFields.wizProduct = wizProduct;
  if (answer) questionFields.answer = answer;
  if (active !== undefined) questionFields.active = active;
  questionFields.updatedAt = Date.now();
  
  // Handle hint field updates
  if (hint) {
    questionFields.hint = {
      text: hint.text || '',
      pointReduction: hint.pointReduction !== undefined ? hint.pointReduction : 10,
      reductionType: hint.reductionType || 'percentage'
    };
  }
  
  // Handle solution field updates
  if (solution) {
    questionFields.solution = {
      description: solution.description || '',
      url: solution.url || ''
    };
  }

  try {
    // Update question
    let question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({ msg: 'Question not found' });
    }
    
    question = await Question.findByIdAndUpdate(
      req.params.id,
      { $set: questionFields },
      { new: true }
    );
    
    // Propagate changes to events that use this question
    await updateQuestionInEvents(req.params.id, questionFields);
    
    res.json(question);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Question not found' });
    }
    res.status(500).send('Server error');
  }
}

// Delete question (admin only)
// Helper function to update embedded question data in events
async function updateQuestionInEvents(questionId, updatedFields) {
  try {
    console.log(`Propagating question updates for question ID: ${questionId} to events`);
    
    // Find all events that contain this question
    const events = await Event.find({
      'questionSet.categories.questions.originalId': questionId
    });
    
    console.log(`Found ${events.length} events using this question`);
    
    // For each event, update the embedded question data
    for (const event of events) {
      let updated = false;
      
      // Loop through categories and questions to find matching question
      for (const category of event.questionSet.categories) {
        for (let i = 0; i < category.questions.length; i++) {
          const question = category.questions[i];
          
          // Check if this is the question we're looking for
          if (question.originalId && question.originalId.toString() === questionId) {
            console.log(`Updating question in event: ${event.name} (${event._id})`);
            
            // Update fields
            if (updatedFields.title) question.title = updatedFields.title;
            if (updatedFields.description) question.description = updatedFields.description;
            if (updatedFields.points) question.points = updatedFields.points;
            if (updatedFields.difficulty) question.difficulty = updatedFields.difficulty;
            if (updatedFields.wizProduct) question.wizProduct = updatedFields.wizProduct;
            if (updatedFields.answer) question.answer = updatedFields.answer;
            if (updatedFields.hint) question.hint = updatedFields.hint;
            if (updatedFields.solution) question.solution = updatedFields.solution;
            
            updated = true;
          }
        }
      }
      
      // Save event if changes were made
      if (updated) {
        await event.save();
        console.log(`Successfully updated event: ${event.name}`);
      }
    }
  } catch (err) {
    console.error('Error updating question in events:', err);
    throw err;
  }
}

export async function deleteQuestion(req, res) {
  try {
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({ msg: 'Question not found' });
    }
    
    // First remove or mark as deleted in events
    try {
      const events = await Event.find({
        'questionSet.categories.questions.originalId': req.params.id
      });
      
      // For each event, update to mark the question as deleted or remove it
      for (const event of events) {
        let updated = false;
        
        // Loop through categories to find and remove/mark the question
        for (const category of event.questionSet.categories) {
          // Filter out the deleted question
          const originalLength = category.questions.length;
          category.questions = category.questions.filter(q => 
            !q.originalId || q.originalId.toString() !== req.params.id
          );
          
          if (category.questions.length !== originalLength) {
            updated = true;
          }
        }
        
        // Save event if changes were made
        if (updated) {
          await event.save();
          console.log(`Removed question from event: ${event.name}`);
        }
      }
    } catch (err) {
      console.error('Error removing question from events:', err);
      // Continue with deletion even if event update fails
    }
    
    // Now delete the actual question
    await Question.findByIdAndRemove(req.params.id);
    
    res.json({ msg: 'Question deleted successfully' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Question not found' });
    }
    res.status(500).send('Server error');
  }
}