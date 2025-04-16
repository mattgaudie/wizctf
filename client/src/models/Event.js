// Event model schema

/**
 * Structure of the Event object:
 * {
 *   _id: String,
 *   name: String,
 *   description: String,
 *   imagePath: String (optional),
 *   questionSetRef: ObjectId (reference to QuestionSet),
 *   questionSet: {
 *     title: String,
 *     description: String,
 *     categories: [
 *       {
 *         name: String,
 *         description: String,
 *         isVisible: Boolean (optional, defaults to true),
 *         questions: [
 *           {
 *             title: String,
 *             description: String,
 *             points: Number,
 *             difficulty: String,
 *             wizProduct: String,
 *             hint: {
 *               text: String,
 *               pointReduction: Number,
 *               reductionType: String ("percentage" or "static")
 *             },
 *             solution: {
 *               description: String,
 *               url: String
 *             },
 *             answer: String,
 *             originalId: ObjectId
 *           }
 *         ]
 *       }
 *     ]
 *   },
 *   eventCode: String,
 *   eventDate: Date,
 *   duration: Number (minutes),
 *   active: Boolean,
 *   createdBy: ObjectId (reference to User),
 *   creatorEmail: String,
 *   participants: [
 *     {
 *       user: ObjectId (reference to User),
 *       joinedAt: Date,
 *       displayName: String,
 *       email: String,
 *       firstName: String (optional),
 *       lastName: String (optional),
 *       organization: String (optional),
 *       answeredQuestions: [String] (array of question IDs),
 *       score: Number
 *     }
 *   ]
 * }
 */