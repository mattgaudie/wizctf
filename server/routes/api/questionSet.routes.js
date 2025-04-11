import { Router } from 'express';
const router = Router();
import { check } from 'express-validator';
import { getAllQuestionSets, getQuestionSetById, createQuestionSet, updateQuestionSet, deleteQuestionSet } from '../../controllers/questionSet.controller.js';
import auth from '../../middleware/auth.middleware.js';
import { isAdmin } from '../../middleware/auth.middleware.js';

// @route   GET api/questionSets
// @desc    Get all question sets
// @access  Admin
router.get('/', [auth, isAdmin], getAllQuestionSets);

// @route   GET api/questionSets/:id
// @desc    Get question set by ID
// @access  Admin
router.get('/:id', [auth, isAdmin], getQuestionSetById);

// @route   POST api/questionSets
// @desc    Create a question set
// @access  Admin
router.post(
  '/',
  [
    auth,
    isAdmin,
    [
      check('title', 'Title is required').not().isEmpty(),
      check('categories', 'Categories must be an array').optional().isArray()
    ]
  ],
  createQuestionSet
);

// @route   PUT api/questionSets/:id
// @desc    Update a question set
// @access  Admin
router.put(
  '/:id',
  [
    auth,
    isAdmin,
    [
      check('title', 'Title is required').optional().not().isEmpty(),
      check('categories', 'Categories must be an array').optional().isArray(),
      check('active', 'Active must be a boolean').optional().isBoolean()
    ]
  ],
  updateQuestionSet
);

// @route   DELETE api/questionSets/:id
// @desc    Delete a question set
// @access  Admin
router.delete('/:id', [auth, isAdmin], deleteQuestionSet);

export default router;