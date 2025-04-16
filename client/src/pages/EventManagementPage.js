import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import MainLayout from '../components/layout/MainLayout.js';
import * as eventService from '../services/event.service.js';
import './DashboardPage.css';
import './EventsPage.css';

const EventManagementPage = () => {
  const { id } = useParams();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answerHistory, setAnswerHistory] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [editingAnswer, setEditingAnswer] = useState({});
  const [editedAnswers, setEditedAnswers] = useState({});
  const [categoryVisibility, setCategoryVisibility] = useState({});
  
  useEffect(() => {
    // Redirect if not authenticated or not admin
    if (!authLoading && (!isAuthenticated || (user && user.role !== 'admin'))) {
      navigate('/login');
    } else {
      fetchEventDetails();
      fetchAnswerHistory();
    }
  }, [isAuthenticated, authLoading, navigate, id, user]);
  
  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      console.log(`Fetching event details for management - ID: ${id}`);
      
      // Get event details using the event service
      const eventData = await eventService.getEventById(id);
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
        const newVisibilityState = {};
        
        // Process each category
        eventData.questionSet.categories.forEach((category, categoryIndex) => {
          // Set default expanded state for category (expand all by default)
          const categoryId = category.name || `category-${categoryIndex}`;
          newExpandedState[categoryId] = true;
          
          // Set default visibility state (true if not specified)
          newVisibilityState[categoryId] = category.isVisible !== false;
          
          if (category.questions && Array.isArray(category.questions)) {
            // Map each question to add category and standardize format
            const categoryQuestions = category.questions.map(q => {
              return {
                _id: q.originalId || q._id, // Use original ID if available
                text: q.description || q.title, // Use description as text field for display
                title: q.title,
                category: category.name,
                points: q.points,
                difficulty: q.difficulty,
                wizProduct: q.wizProduct,
                hint: q.hint, // Include hint information
                answer: q.answer, // Include answer for admin view
              };
            });
            
            // Add to flat list of all questions
            allQuestions.push(...categoryQuestions);
            
            // Add to categorized structure
            if (categoryQuestions.length > 0) {
              categorizedQuestions.push({
                name: category.name,
                description: category.description,
                isVisible: category.isVisible !== false, // Default to true if not specified
                questions: categoryQuestions
              });
            }
          }
        });
        
        console.log(`Extracted ${allQuestions.length} questions in ${categorizedQuestions.length} categories`);
        setQuestions(allQuestions); // Keep flat list for compatibility
        setCategories(categorizedQuestions); // Set categorized questions
        setExpandedCategories(newExpandedState);
        setCategoryVisibility(newVisibilityState);
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
  
  const fetchAnswerHistory = async () => {
    try {
      const history = await eventService.getEventAnswerHistory(id);
      setAnswerHistory(history);
      console.log('Answer history:', history);
    } catch (err) {
      console.error('Error fetching answer history:', err);
    }
  };

  const toggleCategoryExpansion = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };
  
  const handleEditAnswer = (questionId) => {
    // Find the question's current answer
    const question = questions.find(q => q._id === questionId);
    if (question) {
      setEditingAnswer({
        ...editingAnswer,
        [questionId]: true
      });
      setEditedAnswers({
        ...editedAnswers,
        [questionId]: question.answer
      });
    }
  };
  
  const handleCancelEdit = (questionId) => {
    setEditingAnswer({
      ...editingAnswer,
      [questionId]: false
    });
    // Remove from edited answers
    const newEditedAnswers = { ...editedAnswers };
    delete newEditedAnswers[questionId];
    setEditedAnswers(newEditedAnswers);
  };
  
  const handleAnswerChange = (questionId, value) => {
    setEditedAnswers({
      ...editedAnswers,
      [questionId]: value
    });
  };
  
  const handleSaveAnswer = async (questionId) => {
    try {
      const newAnswer = editedAnswers[questionId];
      if (!newAnswer || !newAnswer.trim()) {
        alert('Answer cannot be empty');
        return;
      }
      
      await eventService.updateQuestionAnswer(id, questionId, newAnswer);
      
      // Update the local state
      setQuestions(questions.map(q => 
        q._id === questionId ? { ...q, answer: newAnswer } : q
      ));
      
      // Update in categories
      const updatedCategories = [...categories];
      for (let i = 0; i < updatedCategories.length; i++) {
        const categoryQuestions = updatedCategories[i].questions;
        for (let j = 0; j < categoryQuestions.length; j++) {
          if (categoryQuestions[j]._id === questionId) {
            categoryQuestions[j].answer = newAnswer;
            break;
          }
        }
      }
      setCategories(updatedCategories);
      
      // Reset editing state
      setEditingAnswer({
        ...editingAnswer,
        [questionId]: false
      });
      
      alert('Answer updated successfully');
    } catch (err) {
      console.error('Error updating answer:', err);
      alert('Failed to update answer');
    }
  };
  
  const toggleCategoryVisibility = async (categoryName) => {
    try {
      const currentVisibility = categoryVisibility[categoryName];
      const newVisibility = !currentVisibility;
      
      await eventService.updateCategoryVisibility(id, categoryName, newVisibility);
      
      // Update local state
      setCategoryVisibility({
        ...categoryVisibility,
        [categoryName]: newVisibility
      });
      
      // Update in categories
      const updatedCategories = categories.map(category => 
        category.name === categoryName 
          ? { ...category, isVisible: newVisibility } 
          : category
      );
      setCategories(updatedCategories);
      
      alert(`Category "${categoryName}" is now ${newVisibility ? 'visible' : 'hidden'} to participants`);
    } catch (err) {
      console.error('Error updating category visibility:', err);
      alert('Failed to update category visibility');
    }
  };
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  const getQuestionAnswers = (questionId) => {
    return answerHistory.filter(answer => answer.questionId === questionId);
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
            <h1>Event Management Error</h1>
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
          <h1>Event Management: {event.name}</h1>
          <p>
            <strong>Date:</strong> {formatDate(event.eventDate)}
            &nbsp;|&nbsp;
            <strong>Duration:</strong> {event.duration} minutes
            &nbsp;|&nbsp;
            <strong>Event Code:</strong> {event.eventCode}
          </p>
          <div style={{ marginTop: '10px' }}>
            <button 
              className="btn" 
              onClick={() => navigate(`/events/${id}`)}
              style={{ marginRight: '10px' }}
            >
              View Event
            </button>
            <button 
              className="btn" 
              onClick={() => navigate('/events')}
            >
              Back to Events
            </button>
          </div>
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
              <h2>Manage Questions & Categories</h2>
              {!Array.isArray(categories) || categories.length === 0 ? (
                <p>No questions available for this event.</p>
              ) : (
                <div className="categories-list" style={{ width: '100%', overflow: 'visible' }}>
                  {categories.map((category, categoryIndex) => {
                    const categoryId = category.name || `category-${categoryIndex}`;
                    const isExpanded = expandedCategories[categoryId];
                    const isVisible = categoryVisibility[categoryId];
                    
                    return (
                      <div key={categoryIndex} className="category-container">
                        <div 
                          className="category-header" 
                          style={{ 
                            cursor: 'pointer', 
                            userSelect: 'none',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '15px 20px',
                            backgroundColor: isVisible ? 'white' : '#f8f8f8',
                            borderLeft: isVisible ? '4px solid #0064c8' : '4px solid #999'
                          }}
                        >
                          <div 
                            onClick={() => toggleCategoryExpansion(categoryId)}
                            style={{ flex: 1 }}
                          >
                            <h3>
                              {category.name} 
                              <span style={{ marginLeft: '8px', fontSize: '1rem' }}>
                                {isExpanded ? '▼' : '►'}
                              </span>
                              {!isVisible && (
                                <span style={{ 
                                  marginLeft: '8px', 
                                  fontSize: '0.85rem',
                                  backgroundColor: '#f0f0f0',
                                  color: '#666',
                                  borderRadius: '4px',
                                  padding: '0.25rem 0.5rem'
                                }}>
                                  HIDDEN
                                </span>
                              )}
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
                            </div>
                          </div>
                          
                          <div>
                            <button 
                              className="btn btn-small"
                              onClick={() => toggleCategoryVisibility(category.name)}
                              style={{
                                backgroundColor: isVisible ? '#f0f0f0' : '#0064c8',
                                color: isVisible ? '#333' : 'white'
                              }}
                            >
                              {isVisible ? 'Hide Category' : 'Show Category'}
                            </button>
                          </div>
                        </div>
                        
                        {isExpanded && (
                          <div className="questions-list">
                            {category.questions.map((question, questionIndex) => {
                              if (!question || !question._id) {
                                console.warn('Invalid question data:', question);
                                return null;
                              }
                              
                              const questionAnswers = getQuestionAnswers(question._id);
                              const correctAnswers = questionAnswers.filter(a => a.isCorrect);
                              const isEditing = editingAnswer[question._id];
                              
                              return (
                                <div 
                                  key={question._id} 
                                  className="question-item"
                                  style={{ position: 'relative' }}
                                >
                                  <div className="question-header">
                                    <h4>{question.title || `Question ${questionIndex + 1}`}</h4>
                                    <div className="question-meta">
                                      <span className="question-points">{question.points} points</span>
                                      <span className="question-difficulty">{question.difficulty}</span>
                                      <span className="question-product">{question.wizProduct}</span>
                                    </div>
                                  </div>
                                  
                                  <p className="question-text">{question.text || 'No question text available'}</p>
                                  
                                  {/* Admin Answer Management */}
                                  <div style={{ 
                                    padding: '15px', 
                                    backgroundColor: '#f9f9f9', 
                                    borderRadius: '4px',
                                    margin: '10px 0'
                                  }}>
                                    <h5 style={{ marginTop: 0 }}>Answer Management</h5>
                                    
                                    {isEditing ? (
                                      <div>
                                        <input 
                                          type="text"
                                          value={editedAnswers[question._id] || ''}
                                          onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                                          style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
                                        />
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                          <button 
                                            className="btn btn-small"
                                            onClick={() => handleSaveAnswer(question._id)}
                                          >
                                            Save Answer
                                          </button>
                                          <button 
                                            className="btn btn-small btn-light"
                                            onClick={() => handleCancelEdit(question._id)}
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                          <p style={{ margin: '0', fontWeight: 'bold' }}>
                                            Current Answer: <span style={{ fontFamily: 'monospace', backgroundColor: '#f0f0f0', padding: '3px 6px', borderRadius: '3px' }}>{question.answer}</span>
                                          </p>
                                          <button 
                                            className="btn btn-small"
                                            onClick={() => handleEditAnswer(question._id)}
                                          >
                                            Edit Answer
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Hint Information (if available) */}
                                  {question.hint && question.hint.text && (
                                    <div style={{ 
                                      padding: '15px', 
                                      backgroundColor: '#f0f7ff', 
                                      borderRadius: '4px',
                                      margin: '10px 0'
                                    }}>
                                      <h5 style={{ marginTop: 0 }}>Hint Information</h5>
                                      <p><strong>Hint Text:</strong> {question.hint.text}</p>
                                      <p><strong>Point Reduction:</strong> {question.hint.pointReduction} {question.hint.reductionType === 'percentage' ? '%' : 'points'}</p>
                                    </div>
                                  )}
                                  
                                  {/* Answer Tracking */}
                                  <div style={{ 
                                    padding: '15px', 
                                    backgroundColor: '#f9fff9', 
                                    borderRadius: '4px',
                                    margin: '10px 0'
                                  }}>
                                    <h5 style={{ marginTop: 0 }}>Answer Tracking</h5>
                                    <p><strong>Total Attempts:</strong> {questionAnswers.length}</p>
                                    <p><strong>Correct Answers:</strong> {correctAnswers.length}</p>
                                    
                                    {questionAnswers.length > 0 && (
                                      <div style={{ marginTop: '10px' }}>
                                        <h6>Recent Attempts:</h6>
                                        <div style={{ maxHeight: '200px', overflow: 'auto', border: '1px solid #eee' }}>
                                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                              <tr style={{ backgroundColor: '#f0f0f0' }}>
                                                <th style={{ padding: '8px', textAlign: 'left' }}>User</th>
                                                <th style={{ padding: '8px', textAlign: 'left' }}>Answer</th>
                                                <th style={{ padding: '8px', textAlign: 'left' }}>Result</th>
                                                <th style={{ padding: '8px', textAlign: 'left' }}>Time</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {questionAnswers
                                                .sort((a, b) => new Date(b.ts) - new Date(a.ts))
                                                .slice(0, 10)
                                                .map((answer, index) => (
                                                <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                                                  <td style={{ padding: '8px' }}>
                                                    {answer.displayName || answer.email}
                                                  </td>
                                                  <td style={{ padding: '8px', fontFamily: 'monospace' }}>
                                                    {answer.userAnswer}
                                                  </td>
                                                  <td style={{ padding: '8px' }}>
                                                    <span style={{ 
                                                      color: answer.isCorrect ? 'green' : 'red',
                                                      fontWeight: 'bold'
                                                    }}>
                                                      {answer.isCorrect ? 'Correct' : 'Incorrect'}
                                                    </span>
                                                    {answer.hintUsed && (
                                                      <span style={{ 
                                                        marginLeft: '5px',
                                                        fontSize: '0.8rem',
                                                        color: '#666',
                                                      }}>
                                                        (hint used)
                                                      </span>
                                                    )}
                                                  </td>
                                                  <td style={{ padding: '8px' }}>
                                                    {new Date(answer.ts).toLocaleString()}
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    )}
                                  </div>
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

export default EventManagementPage;