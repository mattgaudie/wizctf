import React, { useState, useEffect } from 'react';
import * as questionSetService from '../../services/questionSet.service.js';
import * as questionService from '../../services/question.service.js';
import QuestionSelectionModal from './QuestionSelectionModal.js';
import './QuestionSetsManager.css';

const QuestionSetsManager = () => {
  const [questionSets, setQuestionSets] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [selectedQuestionSet, setSelectedQuestionSet] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [alert, setAlert] = useState({
    msg: '',
    type: ''
  });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categories: [],
    active: true
  });

  const { title, description, categories, active } = formData;
  
  // New category form data
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    questions: []
  });
  
  // Currently selected category for editing
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(-1);
  
  // All questions from database
  const [allQuestions, setAllQuestions] = useState([]);
  // Questions available for the current category
  const [availableQuestions, setAvailableQuestions] = useState([]);
  // Selected question IDs
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  useEffect(() => {
    fetchQuestionSets();
    fetchQuestions();
  }, []);

  const fetchQuestionSets = async () => {
    try {
      const data = await questionSetService.getAllQuestionSets();
      setQuestionSets(data);
    } catch (err) {
      setAlert({ msg: err.response?.data?.msg || 'Error fetching question sets', type: 'danger' });
    }
  };
  
  const fetchQuestions = async () => {
    try {
      const data = await questionService.getAllQuestions();
      setAllQuestions(data.filter(q => q.active));
    } catch (err) {
      setAlert({ msg: err.response?.data?.msg || 'Error fetching questions', type: 'danger' });
    }
  };
  
  // Get questions that aren't already in other categories
  useEffect(() => {
    if (allQuestions.length > 0) {
      updateAvailableQuestions();
    }
  }, [allQuestions, categories, selectedCategoryIndex]);
  
  // Update the list of available questions based on what's already assigned
  const updateAvailableQuestions = () => {
    // Get all question IDs currently assigned to any category except the selected one
    const assignedQuestionIds = [];
    categories.forEach((category, index) => {
      if (index !== selectedCategoryIndex) {
        category.questions.forEach(q => {
          assignedQuestionIds.push(typeof q === 'string' ? q : q._id);
        });
      }
    });
    
    // Filter out questions that are already assigned
    const available = allQuestions.filter(question => 
      !assignedQuestionIds.includes(question._id)
    );
    
    setAvailableQuestions(available);
    
    // Update selected question IDs based on current category
    if (selectedCategoryIndex >= 0 && categories[selectedCategoryIndex]) {
      setSelectedQuestionIds(
        categories[selectedCategoryIndex].questions.map(q => 
          typeof q === 'string' ? q : q._id
        )
      );
    } else {
      setSelectedQuestionIds([]);
    }
  };

  const onChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };
  
  const onChangeCategoryForm = (e) => {
    const value = e.target.value;
    setCategoryFormData({ ...categoryFormData, [e.target.name]: value });
  };
  
  // Open the question selection modal
  const openQuestionSelectionModal = () => {
    setIsModalOpen(true);
  };
  
  // Handle saving selections from the modal
  const handleSaveQuestionSelections = (selectedIds) => {
    setSelectedQuestionIds(selectedIds);
    setCategoryFormData({ ...categoryFormData, questions: selectedIds });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      categories: [],
      active: true
    });
    resetCategoryForm();
    setIsEdit(false);
    setSelectedQuestionSet(null);
    setSelectedCategoryIndex(-1);
  };
  
  const resetCategoryForm = () => {
    setCategoryFormData({
      name: '',
      description: '',
      questions: []
    });
    setSelectedCategoryIndex(-1);
    setSelectedQuestionIds([]);
  };

  const onSelectQuestionSet = (questionSet) => {
    setSelectedQuestionSet(questionSet);
    setFormData({
      title: questionSet.title || '',
      description: questionSet.description || '',
      categories: questionSet.categories || [],
      active: questionSet.active !== undefined ? questionSet.active : true
    });
    setIsEdit(true);
    resetCategoryForm();
  };
  
  const onSelectCategory = (categoryIndex) => {
    if (categoryIndex >= 0 && categoryIndex < categories.length) {
      const category = categories[categoryIndex];
      const questionIds = category.questions.map(q => typeof q === 'string' ? q : q._id) || [];
      
      setCategoryFormData({
        name: category.name || '',
        description: category.description || '',
        questions: questionIds
      });
      setSelectedCategoryIndex(categoryIndex);
      setSelectedQuestionIds(questionIds);
    }
  };
  
  const addOrUpdateCategory = () => {
    if (!categoryFormData.name) {
      setAlert({ msg: 'Category name is required', type: 'danger' });
      return;
    }
    
    const newCategories = [...categories];
    
    // Format the category data
    const categoryToSave = {
      name: categoryFormData.name,
      description: categoryFormData.description,
      questions: categoryFormData.questions
    };
    
    if (selectedCategoryIndex >= 0) {
      // Update existing category
      newCategories[selectedCategoryIndex] = categoryToSave;
    } else {
      // Add new category
      newCategories.push(categoryToSave);
    }
    
    setFormData({ ...formData, categories: newCategories });
    resetCategoryForm();
  };
  
  const removeCategory = (index) => {
    if (window.confirm('Are you sure you want to remove this category?')) {
      const newCategories = [...categories];
      newCategories.splice(index, 1);
      setFormData({ ...formData, categories: newCategories });
      
      if (selectedCategoryIndex === index) {
        resetCategoryForm();
      }
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isEdit && selectedQuestionSet) {
        // Update existing question set
        await questionSetService.updateQuestionSet(selectedQuestionSet._id, formData);
        setAlert({ msg: 'Question set updated successfully', type: 'success' });
      } else {
        // Create new question set
        await questionSetService.createQuestionSet(formData);
        setAlert({ msg: 'Question set created successfully', type: 'success' });
      }
      
      // Refresh question sets list
      fetchQuestionSets();
      resetForm();
    } catch (err) {
      setAlert({ msg: err.response?.data?.msg || 'Error processing question set', type: 'danger' });
    }
  };

  const onDelete = async (questionSetId) => {
    if (window.confirm('Are you sure you want to delete this question set?')) {
      try {
        await questionSetService.deleteQuestionSet(questionSetId);
        setAlert({ msg: 'Question set deleted successfully', type: 'success' });
        
        // Refresh question sets list
        fetchQuestionSets();
        if (selectedQuestionSet && selectedQuestionSet._id === questionSetId) {
          resetForm();
        }
      } catch (err) {
        setAlert({ msg: err.response?.data?.msg || 'Error deleting question set', type: 'danger' });
      }
    }
  };

  // Helper to get question data by ID
  const getQuestionById = (questionId) => {
    return availableQuestions.find(q => q._id === questionId) || { title: 'Unknown Question' };
  };

  return (
    <div className="question-sets-manager">
      <h2>Question Set Management</h2>
      
      {alert.msg && (
        <div className={`alert alert-${alert.type}`}>
          {alert.msg}
        </div>
      )}
      
      <div className="question-sets-grid">
        <div className="question-sets-form card">
          <h3>{isEdit ? 'Edit Question Set' : 'Create Question Set'}</h3>
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
                rows="3"
              ></textarea>
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
            
            <h4>Categories</h4>
            <div className="categories-list">
              {categories.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Questions</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category, index) => (
                      <tr key={index}>
                        <td>{category.name}</td>
                        <td>{category.questions.length} questions</td>
                        <td>
                          <button 
                            type="button" 
                            className="btn btn-sm"
                            onClick={() => onSelectCategory(index)}
                          >
                            Edit
                          </button>
                          <button 
                            type="button" 
                            className="btn btn-sm btn-danger"
                            onClick={() => removeCategory(index)}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No categories added yet.</p>
              )}
            </div>
            
            <div className="form-divider"></div>
            
            <h4>{selectedCategoryIndex >= 0 ? 'Edit Category' : 'Add Category'}</h4>
            <div className="category-form">
              <div className="form-group">
                <label htmlFor="categoryName">Category Name</label>
                <input
                  type="text"
                  id="categoryName"
                  name="name"
                  value={categoryFormData.name}
                  onChange={onChangeCategoryForm}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="categoryDescription">Category Description</label>
                <textarea
                  id="categoryDescription"
                  name="description"
                  value={categoryFormData.description}
                  onChange={onChangeCategoryForm}
                  rows="2"
                ></textarea>
              </div>
              
              <div className="form-group">
                <label>Questions</label>
                <div className="selected-questions-summary">
                  {selectedQuestionIds.length > 0 ? (
                    <div className="selected-questions-count">
                      {selectedQuestionIds.length} question(s) selected
                    </div>
                  ) : (
                    <div className="no-questions-selected">
                      No questions selected
                    </div>
                  )}
                  <button 
                    type="button" 
                    className="btn select-questions-btn"
                    onClick={openQuestionSelectionModal}
                  >
                    Select Questions
                  </button>
                </div>
              </div>
              
              <QuestionSelectionModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)}
                availableQuestions={availableQuestions}
                selectedQuestionIds={selectedQuestionIds}
                onSave={handleSaveQuestionSelections}
              />
              
              <div className="form-group">
                <button 
                  type="button" 
                  className="btn btn-sm"
                  onClick={addOrUpdateCategory}
                >
                  {selectedCategoryIndex >= 0 ? 'Update Category' : 'Add Category'}
                </button>
                {selectedCategoryIndex >= 0 && (
                  <button
                    type="button"
                    className="btn btn-sm btn-light"
                    onClick={resetCategoryForm}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
            
            <div className="form-divider"></div>
            
            <div className="question-set-form-buttons">
              <button type="submit" className="btn">
                {isEdit ? 'Update Question Set' : 'Create Question Set'}
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
        
        <div className="question-sets-list card">
          <h3>Question Sets</h3>
          {questionSets.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Categories</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {questionSets.map((questionSet) => (
                  <tr key={questionSet._id} className={questionSet.active ? '' : 'question-set-inactive'}>
                    <td>{questionSet.title}</td>
                    <td>{questionSet.categories.length} categories</td>
                    <td>
                      <span className={`badge ${questionSet.active ? 'badge-success' : 'badge-danger'}`}>
                        {questionSet.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm"
                        onClick={() => onSelectQuestionSet(questionSet)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => onDelete(questionSet._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No question sets found. Create your first question set!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionSetsManager;