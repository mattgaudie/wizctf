import QuestionSet from '../models/QuestionSet.js';
import User from '../models/User.js';
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
    );
    
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
export async function deleteQuestionSet(req, res) {
  try {
    const questionSet = await QuestionSet.findById(req.params.id);
    
    if (!questionSet) {
      return res.status(404).json({ msg: 'Question set not found' });
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