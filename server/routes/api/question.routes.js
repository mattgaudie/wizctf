import { Router } from 'express';
const router = Router();
import { check } from 'express-validator';
import { getAllQuestions, getQuestionById, createQuestion, updateQuestion, deleteQuestion } from '../../controllers/question.controller.js';
import auth from '../../middleware/auth.middleware.js';
import { isAdmin } from '../../middleware/auth.middleware.js';

// @route   GET api/questions
// @desc    Get all questions
// @access  Admin
router.get('/', [auth, isAdmin], getAllQuestions);

// @route   GET api/questions/:id
// @desc    Get question by ID
// @access  Admin
router.get('/:id', [auth, isAdmin], getQuestionById);

// @route   POST api/questions
// @desc    Create a question
// @access  Admin
router.post(
  '/',
  [
    auth,
    isAdmin,
    [
      check('title', 'Title is required').not().isEmpty(),
      check('description', 'Description is required').not().isEmpty(),
      check('points', 'Points must be a positive number').isInt({ min: 1 }),
      check('difficulty', 'Difficulty must be easy, medium, or hard').isIn(['easy', 'medium', 'hard']),
      check('wizProduct', 'Wiz Product is required').isIn(['Wiz Cloud', 'Wiz Code', 'Wiz Defend', 'Wiz Sensor']),
      check('answer', 'Answer is required').not().isEmpty()
    ]
  ],
  createQuestion
);

// @route   PUT api/questions/:id
// @desc    Update a question
// @access  Admin
router.put(
  '/:id',
  [
    auth,
    isAdmin,
    [
      check('title', 'Title is required').optional().not().isEmpty(),
      check('description', 'Description is required').optional().not().isEmpty(),
      check('points', 'Points must be a positive number').optional().isInt({ min: 1 }),
      check('difficulty', 'Difficulty must be easy, medium, or hard').optional().isIn(['easy', 'medium', 'hard']),
      check('wizProduct', 'Wiz Product is required').optional().isIn(['Wiz Cloud', 'Wiz Code', 'Wiz Defend', 'Wiz Sensor']),
      check('answer', 'Answer is required').optional().not().isEmpty(),
      check('active', 'Active must be a boolean').optional().isBoolean()
    ]
  ],
  updateQuestion
);

// @route   DELETE api/questions/:id
// @desc    Delete a question
// @access  Admin
router.delete('/:id', [auth, isAdmin], deleteQuestion);

export default router;