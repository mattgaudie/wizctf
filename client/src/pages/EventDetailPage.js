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
  const [shownHints, setShownHints] = useState({});
  
  // For debugging
  useEffect(() => {
    console.log("Questions data:", questions);
    console.log("Current shownHints state:", shownHints);
  }, [questions, shownHints]);
  
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
  
  // Fetch answer history to determine completed questions
  useEffect(() => {
    if (event && isAuthenticated && user) {
      fetchUserAnswers();
    }
  }, [event, isAuthenticated, user]);
  
  const fetchUserAnswers = async () => {
    try {
      // Get user's answer history for this event
      const answerHistory = await eventService.getEventAnswerHistory(id);
      console.log('User answer history:', answerHistory);
      
      // Extract completed questions (correct answers only)
      const completedQuestionIds = answerHistory
        .filter(answer => answer.isCorrect)
        .map(answer => answer.questionId);
      
      // Update the state with unique question IDs
      const uniqueCompletedIds = [...new Set(completedQuestionIds)];
      setAnsweredQuestions(uniqueCompletedIds);
      
      console.log('Updated answered questions from answer history:', uniqueCompletedIds);
    } catch (err) {
      console.error('Error fetching answer history:', err);
    }
  };

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
            // Log some question data to debug hints
            console.log('Sample question with hint:', category.questions[0]);
            
            // Map each question to add category and standardize format
            const categoryQuestions = category.questions.map(q => {
              if (q.hint) {
                console.log(`Question "${q.title}" has hint:`, q.hint);
              } else {
                console.log(`Question "${q.title}" has NO hint`);
              }
              
              return {
                _id: q.originalId || q._id, // Use original ID if available
                text: q.description || q.title, // Use description as text field for display
                title: q.title,
                category: category.name,
                points: q.points,
                difficulty: q.difficulty,
                wizProduct: q.wizProduct,
                hint: q.hint, // Include hint information
                // Don't include the answer in the client-facing data
              };
            });
            
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
  
  const handleShowHint = async (questionId) => {
    console.log('handleShowHint called for question:', questionId);
    try {
      // Request hint from the server, which will record this as an answer event
      console.log('Requesting hint from API...');
      const hintData = await eventService.getQuestionHint(id, questionId);
      console.log('Received hint data:', hintData);
      
      // Update UI to show hint
      setShownHints(prev => {
        const updatedHints = {
          ...prev,
          [questionId]: hintData.hint
        };
        console.log('Updated shownHints state:', updatedHints);
        return updatedHints;
      });
      
      // After getting a hint, refresh answer history to get updated points
      fetchUserAnswers();
    } catch (err) {
      console.error('Error getting hint:', err);
      alert('Could not retrieve hint. Please try again.');
    }
  };

  const handleSubmitAnswer = async (questionId) => {
    try {
      const answer = currentAnswers[questionId];
      
      if (!answer || !answer.trim()) {
        alert('Please enter an answer');
        return;
      }
      
      console.log(`Submitting answer for question ${questionId} in event ${id}`);
      
      // Find the current question to check if hint was used
      const currentQuestion = questions.find(q => q._id === questionId);
      console.log('Current question for submission:', currentQuestion);
      
      // Check if we've shown a hint for this question
      const hintUsed = Boolean(shownHints[questionId]);
      console.log('Hint used?', hintUsed, 'Hint content:', shownHints[questionId]);
      
      // Use the event service to submit the answer
      console.log('Submitting answer with event service...');
      const answerData = { 
        answer: answer.trim(),
        hintUsed: hintUsed,
        hintReduction: currentQuestion?.hint?.pointReduction || 10,
        hintReductionType: currentQuestion?.hint?.reductionType || 'percentage'
      };
      console.log('Answer payload:', answerData);
      
      const data = await eventService.submitAnswer(id, questionId, answerData);
      
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
      
      // Refresh the answer history to keep everything in sync
      fetchUserAnswers();
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
                                  
                                  {/* Hint section */}
                                  {question.hint && question.hint.text && !isAnswered && shownHints[question._id] && (
                                    <div className="hint-box" style={{ marginBottom: '1rem' }}>
                                      <h5>Hint:</h5>
                                      <p>{shownHints[question._id]}</p>
                                      <p className="hint-penalty">
                                        <strong>Note:</strong> Using this hint 
                                        {question.hint.reductionType === 'percentage' ? 
                                          ` reduces your score by ${question.hint.pointReduction}%` : 
                                          ` reduces your score by ${question.hint.pointReduction} points`}
                                      </p>
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
                                      
                                      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                        <button 
                                          className="btn btn-small"
                                          onClick={() => handleSubmitAnswer(question._id)}
                                        >
                                          Submit Answer
                                        </button>
                                        
                                        {question.hint && question.hint.text && !shownHints[question._id] ? (
                                          <button 
                                            className="btn btn-small btn-secondary"
                                            onClick={() => handleShowHint(question._id)}
                                            title={question.hint.reductionType === 'percentage' ? 
                                              `Using the hint reduces your score by ${question.hint.pointReduction}%` : 
                                              `Using the hint reduces your score by ${question.hint.pointReduction} points`}
                                          >
                                            Use Hint {question.hint.reductionType === 'percentage' ? 
                                              `(-${question.hint.pointReduction}%)` : 
                                              `(-${question.hint.pointReduction}pts)`}
                                          </button>
                                        ) : (
                                          question.hint ? (
                                            <span style={{display: 'none'}}>
                                              {console.log('Hint exists but not showing:', question.hint, 'shownHints:', shownHints[question._id])}
                                            </span>
                                          ) : null
                                        )}
                                      </div>
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