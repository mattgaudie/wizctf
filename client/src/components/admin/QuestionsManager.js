import React, { useState, useEffect } from 'react';
import * as questionService from '../../services/question.service.js';
import './QuestionsManager.css';

const QuestionsManager = () => {
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [alert, setAlert] = useState({
    msg: '',
    type: ''
  });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    points: 100,
    difficulty: 'medium',
    wizProduct: 'Wiz Cloud',
    answer: '',
    active: true,
    hint: {
      text: '',
      pointReduction: 10,
      reductionType: 'percentage'
    },
    solution: {
      description: '',
      url: ''
    }
  });

  const { 
    title, 
    description, 
    points, 
    difficulty, 
    wizProduct, 
    answer, 
    active, 
    hint, 
    solution 
  } = formData;

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const data = await questionService.getAllQuestions();
      setQuestions(data);
    } catch (err) {
      setAlert({ msg: err.response?.data?.msg || 'Error fetching questions', type: 'danger' });
    }
  };

  const onChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    const name = e.target.name;
    
    // Handle nested object properties
    if (name.includes('.')) {
      const [objectName, propertyName] = name.split('.');
      setFormData({
        ...formData,
        [objectName]: {
          ...formData[objectName],
          [propertyName]: value
        }
      });
      return;
    }
    
    // Set points based on difficulty selection
    if (name === 'difficulty') {
      let points;
      switch (value) {
        case 'easy':
          points = 50;
          break;
        case 'medium':
          points = 100;
          break;
        case 'hard':
          points = 150;
          break;
        default:
          points = 100;
      }
      setFormData({ ...formData, [name]: value, points });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      points: 100,
      difficulty: 'medium',
      wizProduct: 'Wiz Cloud',
      answer: '',
      active: true,
      hint: {
        text: '',
        pointReduction: 10,
        reductionType: 'percentage'
      },
      solution: {
        description: '',
        url: ''
      }
    });
    setIsEdit(false);
    setSelectedQuestion(null);
  };

  const onSelectQuestion = (question) => {
    setSelectedQuestion(question);
    setFormData({
      title: question.title || '',
      description: question.description || '',
      points: question.points || 100,
      difficulty: question.difficulty || 'medium',
      wizProduct: question.wizProduct || 'Wiz Cloud',
      answer: question.answer || '',
      active: question.active !== undefined ? question.active : true,
      hint: {
        text: question.hint?.text || '',
        pointReduction: question.hint?.pointReduction || 10,
        reductionType: question.hint?.reductionType || 'percentage'
      },
      solution: {
        description: question.solution?.description || '',
        url: question.solution?.url || ''
      }
    });
    setIsEdit(true);
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isEdit && selectedQuestion) {
        // Update existing question
        await questionService.updateQuestion(selectedQuestion._id, formData);
        setAlert({ msg: 'Question updated successfully', type: 'success' });
      } else {
        // Create new question
        await questionService.createQuestion(formData);
        setAlert({ msg: 'Question created successfully', type: 'success' });
      }
      
      // Refresh questions list
      fetchQuestions();
      resetForm();
    } catch (err) {
      setAlert({ msg: err.response?.data?.msg || 'Error processing question', type: 'danger' });
    }
  };

  const onDelete = async (questionId) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        await questionService.deleteQuestion(questionId);
        setAlert({ msg: 'Question deleted successfully', type: 'success' });
        
        // Refresh questions list
        fetchQuestions();
        if (selectedQuestion && selectedQuestion._id === questionId) {
          resetForm();
        }
      } catch (err) {
        setAlert({ msg: err.response?.data?.msg || 'Error deleting question', type: 'danger' });
      }
    }
  };

  return (
    <div className="questions-manager">
      <h2>Question Management</h2>
      
      {alert.msg && (
        <div className={`alert alert-${alert.type}`}>
          {alert.msg}
        </div>
      )}
      
      <div className="questions-grid">
        <div className="questions-form card">
          <h3>{isEdit ? 'Edit Question' : 'Create Question'}</h3>
          <form onSubmit={onSubmit}>
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={title}
                onChange={onChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={description}
                onChange={onChange}
                rows="5"
                required
              ></textarea>
            </div>
            
            <div className="form-group">
              <label htmlFor="answer">Correct Answer</label>
              <input
                type="text"
                id="answer"
                name="answer"
                value={answer}
                onChange={onChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="points">Points</label>
              <input
                type="number"
                id="points"
                name="points"
                value={points}
                onChange={onChange}
                min="1"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="difficulty">Difficulty</label>
              <select
                id="difficulty"
                name="difficulty"
                value={difficulty}
                onChange={onChange}
                required
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="wizProduct">Wiz Product</label>
              <select
                id="wizProduct"
                name="wizProduct"
                value={wizProduct}
                onChange={onChange}
                required
              >
                <option value="Wiz Cloud">Wiz Cloud</option>
                <option value="Wiz Code">Wiz Code</option>
                <option value="Wiz Defend">Wiz Defend</option>
                <option value="Wiz Sensor">Wiz Sensor</option>
              </select>
            </div>
            
            {/* Hint Section */}
            <div className="form-section">
              <h4>Hint Information (Optional)</h4>
              <div className="form-group">
                <label htmlFor="hint.text">Hint Text</label>
                <textarea
                  id="hint.text"
                  name="hint.text"
                  value={hint.text}
                  onChange={onChange}
                  rows="3"
                  placeholder="Provide a hint that will help users solve the question"
                ></textarea>
                <small className="form-text">This hint will be shown to users if they request it, and will reduce the available points.</small>
              </div>
              
              <div className="form-row">
                <div className="form-group half-width">
                  <label htmlFor="hint.pointReduction">Point Reduction</label>
                  <input
                    type="number"
                    id="hint.pointReduction"
                    name="hint.pointReduction"
                    value={hint.pointReduction}
                    onChange={onChange}
                    min="0"
                    max="100"
                  />
                </div>
                
                <div className="form-group half-width">
                  <label htmlFor="hint.reductionType">Reduction Type</label>
                  <select
                    id="hint.reductionType"
                    name="hint.reductionType"
                    value={hint.reductionType}
                    onChange={onChange}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="static">Static (points)</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Solution Section (Admin Only) */}
            <div className="form-section">
              <h4>Solution Information (Admin Only)</h4>
              <div className="form-group">
                <label htmlFor="solution.description">Solution Description</label>
                <textarea
                  id="solution.description"
                  name="solution.description"
                  value={solution.description}
                  onChange={onChange}
                  rows="3"
                  placeholder="Describe how to solve this question for administrators"
                ></textarea>
                <small className="form-text">This is only visible to administrators.</small>
              </div>
              
              <div className="form-group">
                <label htmlFor="solution.url">Solution URL (Optional)</label>
                <input
                  type="text"
                  id="solution.url"
                  name="solution.url"
                  value={solution.url}
                  onChange={onChange}
                  placeholder="https://example.com/solution-guide"
                />
                <small className="form-text">Link to a reference, answer, or guide (admin only).</small>
              </div>
            </div>
            
            {isEdit && (
              <div className="form-group form-checkbox">
                <input
                  type="checkbox"
                  id="active"
                  name="active"
                  checked={active}
                  onChange={onChange}
                />
                <label htmlFor="active">Active</label>
              </div>
            )}
            
            <div className="question-form-buttons">
              <button type="submit" className="btn">
                {isEdit ? 'Update Question' : 'Create Question'}
              </button>
              {isEdit && (
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
        
        <div className="questions-list card">
          <h3>Questions</h3>
          {questions.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Difficulty</th>
                  <th>Points</th>
                  <th>Wiz Product</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((question) => (
                  <tr key={question._id} className={question.active ? '' : 'question-inactive'}>
                    <td>{question.title}</td>
                    <td>
                      <span className={`badge badge-${question.difficulty}`}>
                        {question.difficulty}
                      </span>
                    </td>
                    <td>{question.points}</td>
                    <td>{question.wizProduct}</td>
                    <td>
                      <span className={`badge ${question.active ? 'badge-success' : 'badge-danger'}`}>
                        {question.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm"
                        onClick={() => onSelectQuestion(question)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => onDelete(question._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No questions found. Create your first question!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionsManager;