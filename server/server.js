import express, { json } from 'express';
import cors from 'cors';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import config from 'config';

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Connect to database
connectDB();

const app = express();

// Init middleware
app.use(json({ extended: false }));
app.use(cors());

// Serve static files from the uploads directory
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// Define routes
import authRoutes from './routes/api/auth.routes.js';
import userRoutes from './routes/api/user.routes.js';
import adminRoutes from './routes/api/admin.routes.js';
import questionRoutes from './routes/api/question.routes.js';
import questionSetRoutes from './routes/api/questionSet.routes.js';
import eventRoutes from './routes/api/event.routes.js';

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/questionSets', questionSetRoutes);
app.use('/api/events', eventRoutes);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static(join(__dirname, '../client/build')));
}

// Handle SPA routing in all environments
app.get('*', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    res.sendFile(resolve(__dirname, '../client/build', 'index.html'));
  } else {
    res.sendFile(resolve(__dirname, '../client/public/index.html'));
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));