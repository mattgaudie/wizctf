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
    active: true
  });

  const { title, description, points, difficulty, wizProduct, answer, active } = formData;

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
    
    // Set points based on difficulty selection
    if (e.target.name === 'difficulty') {
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
      setFormData({ ...formData, [e.target.name]: value, points });
    } else {
      setFormData({ ...formData, [e.target.name]: value });
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
      active: true
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
      active: question.active !== undefined ? question.active : true
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