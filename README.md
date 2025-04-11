Project Structure
The application is divided into two main parts:
Backend (server)

Models: MongoDB schemas for users
Controllers: Logic for handling requests
Routes: API endpoints
Middleware: Authentication, admin access, file uploads
Config: Database connection, environment variables

Frontend (client)

Components: Reusable UI elements
Pages: Main application screens
Context: State management for authentication
Styles: Global and component-specific styling

How to Run the Application
Prerequisites

Node.js (v14 or later)
MongoDB (local or cloud instance)

Setup

Clone the repository:
git clone <repository-url>
cd mern-app

Install server dependencies:
cd server
npm install

Install client dependencies:
cd ../client
npm install

Configure MongoDB:

Create a MongoDB database named "ctf"
Update the connection string in server/config/default.json if needed
The default connection string is "mongodb://localhost:27017/ctf"


Start the application in development mode:
cd ../server
npm run dev
This will start both the server and client concurrently.
Access the application:

Open your browser and go to http://localhost:3000
Server API runs at http://localhost:5000



Key Implementation Details
Backend Security Features

Password Security:

Passwords are hashed using bcrypt before storing in the database
Password reset requires current password verification


JWT Authentication:

JSON Web Tokens are used for stateless authentication
Tokens expire after 24 hours
Protected routes verify token authenticity


Role-Based Access Control:

Admin-only routes are protected by middleware
Users with "@wiz.io" email domain are automatically assigned admin role



Frontend Features

Context API:

AuthContext manages global authentication state
User information is stored for easy access across components


Responsive Design:

Layouts adjust for desktop and mobile views
Blue and white color scheme as requested


Form Validation:

Client-side validation for all user inputs
Error handling and display



Future Enhancements
The application is structured to easily accommodate future features:

API Extensions:

The routing system allows for adding new API endpoints
Controllers and models are modular for easy expansion


UI Enhancements:

Component structure supports adding new pages and features
Global styling ensures consistency across the application


