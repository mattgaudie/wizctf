import { Router } from 'express';
import {
  getAllEvents,
  getActiveEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  joinEvent,
  getEventParticipants,
  getUserEvents,
  checkAnswer,
  getEventAnswerHistory,
  getUserAnswerHistory,
  trackHintUsage,
  updateQuestionAnswer,
  updateCategoryVisibility
} from '../../controllers/event.controller.js';
import auth from '../../middleware/auth.middleware.js';
import { isAdmin } from '../../middleware/admin.middleware.js';
import { uploadEvent as upload } from '../../middleware/upload.middleware.js';
import { check } from 'express-validator';

const router = Router();

// @route   GET api/events
// @desc    Get all events (admin only)
// @access  Private/Admin
router.get('/', [auth, isAdmin], getAllEvents);

// @route   GET api/events/user
// @desc    Get events for the authenticated user
// @access  Private
router.get('/user', auth, getUserEvents);

// @route   GET api/events/active
// @desc    Get all active events for regular users
// @access  Private
router.get('/active', auth, getActiveEvents);

// @route   GET api/events/:id
// @desc    Get event by ID (admin only or participant)
// @access  Private
router.get('/:id', auth, getEventById);

// @route   POST api/events
// @desc    Create a new event (admin only)
// @access  Private/Admin
router.post(
  '/',
  [
    auth,
    isAdmin,
    upload.single('image'),
    [
      check('name', 'Name is required').not().isEmpty(),
      check('questionSet', 'Question set is required').not().isEmpty(),
      check('eventCode', 'Event code is required').not().isEmpty(),
      check('eventDate', 'Event date is required').not().isEmpty()
    ]
  ],
  createEvent
);

// @route   PUT api/events/:id
// @desc    Update an existing event (admin only)
// @access  Private/Admin
router.put(
  '/:id',
  [
    auth,
    isAdmin,
    upload.single('image'),
    [
      check('name', 'Name is required').not().isEmpty(),
      check('questionSet', 'Question set is required').not().isEmpty(),
      check('eventCode', 'Event code is required').not().isEmpty(),
      check('eventDate', 'Event date is required').not().isEmpty()
    ]
  ],
  updateEvent
);

// @route   DELETE api/events/:id
// @desc    Delete an event (admin only)
// @access  Private/Admin
router.delete('/:id', [auth, isAdmin], deleteEvent);

// @route   POST api/events/join
// @desc    Join an event using an event code
// @access  Private
router.post(
  '/join',
  [
    auth,
    [
      check('eventCode', 'Event code is required').not().isEmpty()
    ]
  ],
  joinEvent
);

// @route   GET api/events/:id/participants
// @desc    Get all participants for an event (admin only)
// @access  Private/Admin
router.get('/:id/participants', [auth, isAdmin], getEventParticipants);

// @route   POST api/events/:eventId/questions/:questionId/answer
// @desc    Check an answer for a question in an event
// @access  Private
router.post(
  '/:eventId/questions/:questionId/answer',
  [
    auth,
    [
      check('answer', 'Answer is required').not().isEmpty()
    ]
  ],
  checkAnswer
);

// @route   GET api/events/:eventId/answers
// @desc    Get answer history for an event (admin sees all, users see only their own)
// @access  Private
router.get(
  '/:eventId/answers',
  auth,
  getEventAnswerHistory
);

// @route   GET api/events/:eventId/answers/:userId
// @desc    Get user specific answer history for an event
// @access  Private (admin or the user themselves)
router.get(
  '/:eventId/answers/:userId',
  auth,
  getUserAnswerHistory
);

// @route   GET api/events/:eventId/questions/:questionId/hint
// @desc    Get a hint for a question and track hint usage
// @access  Private
router.get(
  '/:eventId/questions/:questionId/hint',
  auth,
  trackHintUsage
);

// @route   PUT api/events/:eventId/questions/:questionId/answer
// @desc    Update a question's answer (admin only)
// @access  Private/Admin
router.put(
  '/:eventId/questions/:questionId/answer',
  [
    auth,
    isAdmin,
    [
      check('answer', 'Answer is required').not().isEmpty()
    ]
  ],
  updateQuestionAnswer
);

// @route   PUT api/events/:eventId/categories/:categoryName
// @desc    Update category visibility (admin only)
// @access  Private/Admin
router.put(
  '/:eventId/categories/:categoryName',
  [
    auth,
    isAdmin,
    [
      check('isVisible', 'isVisible is required').isBoolean()
    ]
  ],
  updateCategoryVisibility
);

export default router;