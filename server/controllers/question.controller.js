import Question from '../models/Question.js';
import User from '../models/User.js';
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

  const { title, description, points, difficulty, wizProduct, answer } = req.body;

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

  const { title, description, points, difficulty, wizProduct, answer, active } = req.body;

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
export async function deleteQuestion(req, res) {
  try {
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({ msg: 'Question not found' });
    }
    
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