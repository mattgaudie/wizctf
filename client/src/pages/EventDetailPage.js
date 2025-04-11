import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import MainLayout from '../components/layout/MainLayout.js';
import './DashboardPage.css';
import './EventsPage.css';

const EventDetailPage = () => {
  const { id } = useParams();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentAnswers, setCurrentAnswers] = useState({});

  useEffect(() => {
    // Redirect if not authenticated
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    } else {
      fetchEventDetails();
    }
  }, [isAuthenticated, authLoading, navigate, id]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      
      // Get event details
      const eventResponse = await fetch(`/api/events/${id}`, {
        headers: {
          'x-auth-token': localStorage.getItem('token')
        }
      });
      
      if (!eventResponse.ok) {
        if (eventResponse.status === 404) {
          throw new Error('Event not found');
        } else if (eventResponse.status === 403) {
          throw new Error('You do not have access to this event');
        } else {
          throw new Error('Failed to fetch event details');
        }
      }
      
      const eventData = await eventResponse.json();
      setEvent(eventData);
      
      // Get questions for this event's question set
      if (eventData.questionSet) {
        const questionsResponse = await fetch(`/api/questionSets/${eventData.questionSet._id}/questions`, {
          headers: {
            'x-auth-token': localStorage.getItem('token')
          }
        });
        
        if (!questionsResponse.ok) {
          throw new Error('Failed to fetch questions');
        }
        
        const questionsData = await questionsResponse.json();
        setQuestions(questionsData);
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching event data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setCurrentAnswers({
      ...currentAnswers,
      [questionId]: answer
    });
  };

  const handleSubmitAnswer = async (questionId) => {
    try {
      const answer = currentAnswers[questionId];
      
      if (!answer || !answer.trim()) {
        alert('Please enter an answer');
        return;
      }
      
      const response = await fetch(`/api/events/${id}/questions/${questionId}/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token')
        },
        body: JSON.stringify({ answer })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        alert(data.msg || 'Failed to submit answer');
        return;
      }
      
      // Clear the answer input and show feedback
      setCurrentAnswers({
        ...currentAnswers,
        [questionId]: ''
      });
      
      if (data.correct) {
        alert('Correct answer!');
      } else {
        alert('Incorrect answer. Try again!');
      }
      
      // Refresh questions to update status
      fetchEventDetails();
    } catch (err) {
      alert('An error occurred. Please try again.');
      console.error(err);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="dashboard-loading">
          <h2>Loading...</h2>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="dashboard-container">
          <div className="dashboard-header">
            <h1>Event Error</h1>
          </div>
          <div className="alert alert-danger">
            {error}
          </div>
          <button className="btn" onClick={() => navigate('/events')}>
            Back to Events
          </button>
        </div>
      </MainLayout>
    );
  }

  if (!event) {
    return (
      <MainLayout>
        <div className="dashboard-container">
          <div className="dashboard-header">
            <h1>Event Not Found</h1>
          </div>
          <p>The event you're looking for doesn't exist or you don't have access to it.</p>
          <button className="btn" onClick={() => navigate('/events')}>
            Back to Events
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>{event.name}</h1>
          <p>
            <strong>Date:</strong> {formatDate(event.eventDate)}
            &nbsp;|&nbsp;
            <strong>Duration:</strong> {event.duration} minutes
          </p>
        </div>

        {event.description && (
          <div className="card dashboard-card">
            <h2>Description</h2>
            <p>{event.description}</p>
          </div>
        )}

        <div className="dashboard-content">
          <div className="card dashboard-card">
            <h2>Questions</h2>
            {questions.length === 0 ? (
              <p>No questions available for this event.</p>
            ) : (
              <div className="questions-list">
                {questions.map((question, index) => (
                  <div key={question._id} className="question-item">
                    <h3>Question {index + 1}</h3>
                    <p>{question.text}</p>
                    
                    {question.imageUrl && (
                      <div className="question-image">
                        <img src={question.imageUrl} alt={`Question ${index + 1}`} />
                      </div>
                    )}
                    
                    {question.options && question.options.length > 0 ? (
                      // Multiple choice question
                      <div className="options-list">
                        {question.options.map((option, optIndex) => (
                          <div key={optIndex} className="option-item">
                            <input
                              type="radio"
                              id={`option-${question._id}-${optIndex}`}
                              name={`question-${question._id}`}
                              value={option}
                              checked={currentAnswers[question._id] === option}
                              onChange={() => handleAnswerChange(question._id, option)}
                            />
                            <label htmlFor={`option-${question._id}-${optIndex}`}>
                              {option}
                            </label>
                          </div>
                        ))}
                      </div>
                    ) : (
                      // Free text answer
                      <div className="answer-input">
                        <input
                          type="text"
                          placeholder="Enter your answer"
                          value={currentAnswers[question._id] || ''}
                          onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                        />
                      </div>
                    )}
                    
                    <button 
                      className="btn btn-small"
                      onClick={() => handleSubmitAnswer(question._id)}
                    >
                      Submit Answer
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default EventDetailPage;