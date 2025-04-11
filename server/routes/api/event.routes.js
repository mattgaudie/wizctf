import { Router } from 'express';
const router = Router();
import { check } from 'express-validator';
import { 
  getAllEvents, 
  getEventById, 
  createEvent, 
  updateEvent, 
  deleteEvent, 
  joinEvent,
  getEventParticipants
} from '../../controllers/event.controller.js';
import auth from '../../middleware/auth.middleware.js';
import { isAdmin } from '../../middleware/auth.middleware.js';
import { uploadEvent } from '../../middleware/upload.middleware.js';

// @route   GET api/events
// @desc    Get all events (admin only)
// @access  Admin
router.get('/', [auth, isAdmin], getAllEvents);

// @route   GET api/events/:id
// @desc    Get event by ID (admin only)
// @access  Admin
router.get('/:id', [auth, isAdmin], getEventById);

// @route   POST api/events
// @desc    Create an event (admin only)
// @access  Admin
router.post(
  '/',
  [
    auth,
    isAdmin,
    uploadEvent.single('eventImage'),
    [
      check('name', 'Name is required').not().isEmpty(),
      check('questionSet', 'Question set is required').not().isEmpty(),
      check('eventCode', 'Event code is required').not().isEmpty(),
      check('eventDate', 'Event date is required').not().isEmpty().isISO8601(),
      check('duration', 'Duration must be a positive number').optional().isInt({ min: 1 })
    ]
  ],
  createEvent
);

// @route   PUT api/events/:id
// @desc    Update an event (admin only)
// @access  Admin
router.put(
  '/:id',
  [
    auth,
    isAdmin,
    uploadEvent.single('eventImage'),
    [
      check('name', 'Name is required').optional().not().isEmpty(),
      check('questionSet', 'Question set is required').optional().not().isEmpty(),
      check('eventCode', 'Event code is required').optional().not().isEmpty(),
      check('eventDate', 'Event date must be valid').optional().isISO8601(),
      check('duration', 'Duration must be a positive number').optional().isInt({ min: 1 }),
      check('active', 'Active must be a boolean').optional().isBoolean()
    ]
  ],
  updateEvent
);

// @route   DELETE api/events/:id
// @desc    Delete an event (admin only)
// @access  Admin
router.delete('/:id', [auth, isAdmin], deleteEvent);

// @route   POST api/events/join
// @desc    Join an event with event code (users)
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
// @desc    Get participants for an event (admin only)
// @access  Admin
router.get('/:id/participants', [auth, isAdmin], getEventParticipants);

export default router;