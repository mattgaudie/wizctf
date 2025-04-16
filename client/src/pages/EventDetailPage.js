import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import MainLayout from '../components/layout/MainLayout.js';
import * as eventService from '../services/event.service.js';
import * as questionSetService from '../services/questionSet.service.js';
import './DashboardPage.css';
import './EventsPage.css';

const EventDetailPage = () => {
  const { id } = useParams();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentAnswers, setCurrentAnswers] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});
  const [answeredQuestions, setAnsweredQuestions] = useState([]);
  
  // For debugging
  useEffect(() => {
    console.log("Current expandedCategories state:", expandedCategories);
    console.log("Categories data:", categories);
  }, [expandedCategories, categories]);

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
      console.log(`Fetching event details for ID: ${id}`);
      
      // Get event details using the event service
      const eventData = await eventService.getEventById(id);
      console.log('Event data retrieved:', eventData);
      setEvent(eventData);
      
      // Set questions to empty array by default
      setQuestions([]);
      
      // Extract questions from embedded data if available
      if (eventData.questionSet && Array.isArray(eventData.questionSet.categories)) {
        console.log('Using embedded question data from event');
        
        // Prepare categorized questions
        const allQuestions = [];
        const categorizedQuestions = [];
        
        // Create new expanded state
        const newExpandedState = {};
        
        // Process each category
        eventData.questionSet.categories.forEach((category, categoryIndex) => {
          // Set default expanded state for category (expand all by default)
          const categoryId = category.name || `category-${categoryIndex}`;
          newExpandedState[categoryId] = true;
          
          if (category.questions && Array.isArray(category.questions)) {
            // Map each question to add category and standardize format
            const categoryQuestions = category.questions.map(q => ({
              _id: q.originalId || q._id, // Use original ID if available
              text: q.description || q.title, // Use description as text field for display
              title: q.title,
              category: category.name,
              points: q.points,
              difficulty: q.difficulty,
              wizProduct: q.wizProduct,
              // Don't include the answer in the client-facing data
            }));
            
            // Add to flat list of all questions
            allQuestions.push(...categoryQuestions);
            
            // Add to categorized structure
            if (categoryQuestions.length > 0) {
              categorizedQuestions.push({
                name: category.name,
                description: category.description,
                questions: categoryQuestions
              });
            }
          }
        });
        
        console.log(`Extracted ${allQuestions.length} questions in ${categorizedQuestions.length} categories`);
        setQuestions(allQuestions); // Keep flat list for compatibility
        setCategories(categorizedQuestions); // Set categorized questions
        setExpandedCategories(newExpandedState);
        
        // Check for answered questions if event has participants field
        if (eventData.participants && Array.isArray(eventData.participants) && user) {
          const currentUser = eventData.participants.find(
            p => p.email === user.email || p.userId === user._id
          );
          
          if (currentUser && Array.isArray(currentUser.answeredQuestions)) {
            setAnsweredQuestions(currentUser.answeredQuestions);
          }
        }
      } else {
        console.warn('No embedded question data available in event');
        setQuestions([]);
        setCategories([]);
      }
    } catch (err) {
      console.error('Error fetching event details:', err);
      let errorMessage = 'An error occurred while fetching event data';
      
      if (err.response) {
        if (err.response.status === 404) {
          errorMessage = 'Event not found';
        } else if (err.response.status === 403) {
          errorMessage = 'You do not have access to this event';
        } else if (err.response.data && err.response.data.msg) {
          errorMessage = err.response.data.msg;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
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

  const toggleCategoryExpansion = (categoryId) => {
    console.log(`Toggling category: ${categoryId}`);
    console.log(`Current state:`, expandedCategories);
    
    // Force re-render by creating a new object
    setExpandedCategories(prev => {
      // Create new object with all existing values
      const newState = {...prev};
      // Toggle the value for this category
      newState[categoryId] = !prev[categoryId];
      
      console.log("New state will be:", newState);
      return newState;
    });
  };

  const isQuestionAnswered = (questionId) => {
    return answeredQuestions.includes(questionId);
  };

  const handleSubmitAnswer = async (questionId) => {
    try {
      const answer = currentAnswers[questionId];
      
      if (!answer || !answer.trim()) {
        alert('Please enter an answer');
        return;
      }
      
      console.log(`Submitting answer for question ${questionId} in event ${id}`);
      
      // Use our endpoint that works with embedded data
      const response = await fetch(`/api/events/${id}/questions/${questionId}/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token')
        },
        body: JSON.stringify({ answer: answer.trim() })
      });
      
      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        alert("Received unexpected response from server. Please try again.");
        console.error("Non-JSON response:", await response.text());
        return;
      }
      
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
        const pointsMsg = data.points ? ` (${data.points} points)` : '';
        alert(`Correct answer!${pointsMsg}`);
        
        // Add question to answered questions list
        if (!answeredQuestions.includes(questionId)) {
          setAnsweredQuestions(prev => [...prev, questionId]);
        }
      } else {
        alert('Incorrect answer. Try again!');
      }
      
      // No need to refresh the whole event, as the questions are embedded
      // fetchEventDetails();
    } catch (err) {
      alert('An error occurred. Please try again.');
      console.error('Error submitting answer:', err);
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

        <div className="event-details-layout">
          {event.description && (
            <div className="card event-description-card">
              <h2>Description</h2>
              <p>{event.description}</p>
            </div>
          )}

          <div className="questions-container" style={{ width: '100%', overflow: 'visible' }}>
            <div className="card full-width-card" style={{ width: '100%', maxWidth: '100%', overflow: 'visible' }}>
              <h2>Questions</h2>
              {!Array.isArray(categories) || categories.length === 0 ? (
                <p>No questions available for this event.</p>
              ) : (
                <div className="categories-list" style={{ width: '100%', overflow: 'visible' }}>
                  {categories.map((category, categoryIndex) => {
                    const categoryId = category.name || `category-${categoryIndex}`;
                    const isExpanded = expandedCategories[categoryId];
                    
                    return (
                      <div key={categoryIndex} className="category-container">
                        <div 
                          className="category-header" 
                          onClick={() => toggleCategoryExpansion(categoryId)}
                          style={{ cursor: 'pointer', userSelect: 'none' }}
                        >
                          <h3>
                            {category.name} 
                            <span style={{ marginLeft: '8px', fontSize: '1rem' }}>
                              {isExpanded ? '▼' : '►'}
                            </span>
                          </h3>
                          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                            {category.description && (
                              <p className="category-description">{category.description}</p>
                            )}
                            <span style={{ 
                              backgroundColor: '#e6f3ff', 
                              color: '#0064c8',
                              borderRadius: '4px',
                              padding: '0.25rem 0.5rem',
                              fontSize: '0.8rem'
                            }}>
                              {category.questions.length} questions
                            </span>
                            <span style={{ 
                              backgroundColor: '#e6fff2', 
                              color: '#007755',
                              borderRadius: '4px',
                              padding: '0.25rem 0.5rem',
                              fontSize: '0.8rem'
                            }}>
                              {category.questions.filter(q => isQuestionAnswered(q._id)).length} solved
                            </span>
                          </div>
                        </div>
                        
                        {isExpanded && (
                          <div className="questions-list">
                            {category.questions.map((question, questionIndex) => {
                              if (!question || !question._id) {
                                console.warn('Invalid question data:', question);
                                return null;
                              }
                              
                              const isAnswered = isQuestionAnswered(question._id);
                              
                              return (
                                <div 
                                  key={question._id} 
                                  className={`question-item ${isAnswered ? 'completed' : ''}`}
                                  style={{ position: 'relative' }}
                                >
                                  {isAnswered && (
                                    <div className="question-status" title="Completed">
                                      ✓
                                    </div>
                                  )}
                                  
                                  <div className="question-header">
                                    <h4>{question.title || `Question ${questionIndex + 1}`}</h4>
                                    <div className="question-meta">
                                      <span className="question-points">{question.points} points</span>
                                      <span className="question-difficulty">{question.difficulty}</span>
                                      <span className="question-product">{question.wizProduct}</span>
                                    </div>
                                  </div>
                                  
                                  <p className="question-text">{question.text || 'No question text available'}</p>
                                  
                                  {question.imageUrl && (
                                    <div className="question-image">
                                      <img src={question.imageUrl} alt={`${question.title}`} />
                                    </div>
                                  )}
                                  
                                  {!isAnswered && (
                                    <>
                                      {Array.isArray(question.options) && question.options.length > 0 ? (
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
                                    </>
                                  )}
                                  
                                  {isAnswered && (
                                    <div style={{ 
                                      padding: '0.75rem', 
                                      backgroundColor: '#e6fff2', 
                                      borderRadius: '4px',
                                      marginTop: '1rem'
                                    }}>
                                      <p style={{ margin: 0, color: '#007755' }}>
                                        ✓ You've successfully completed this challenge!
                                      </p>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default EventDetailPage;