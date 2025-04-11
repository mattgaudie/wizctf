import React, { useState, useEffect } from 'react';
import './QuestionSelectionModal.css';

const QuestionSelectionModal = ({ 
  isOpen, 
  onClose, 
  availableQuestions, 
  selectedQuestionIds, 
  onSave 
}) => {
  const [localSelectedIds, setLocalSelectedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  
  const questionsPerPage = 10;
  
  // Initialize local state from props
  useEffect(() => {
    if (isOpen) {
      setLocalSelectedIds([...selectedQuestionIds]);
      setCurrentPage(1);
      setSearchQuery('');
    }
  }, [isOpen, selectedQuestionIds]);
  
  // Filter questions based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredQuestions(availableQuestions);
    } else {
      const query = searchQuery.toLowerCase().trim();
      setFilteredQuestions(
        availableQuestions.filter(q => 
          q.title.toLowerCase().includes(query) || 
          q.difficulty.toLowerCase().includes(query) ||
          q.wizProduct.toLowerCase().includes(query)
        )
      );
    }
    setCurrentPage(1);
  }, [searchQuery, availableQuestions]);
  
  // Handle checkbox changes
  const handleQuestionCheckboxChange = (questionId) => {
    let updated = [...localSelectedIds];
    
    if (updated.includes(questionId)) {
      updated = updated.filter(id => id !== questionId);
    } else {
      updated.push(questionId);
    }
    
    setLocalSelectedIds(updated);
  };
  
  // Calculate pagination
  const indexOfLastQuestion = currentPage * questionsPerPage;
  const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage;
  const currentQuestions = filteredQuestions.slice(indexOfFirstQuestion, indexOfLastQuestion);
  const totalPages = Math.ceil(filteredQuestions.length / questionsPerPage);
  
  // Handle pagination
  const goToPage = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };
  
  // Save selections and close modal
  const handleSave = () => {
    onSave(localSelectedIds);
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Select Questions</h3>
          <button className="modal-close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-search">
          <input
            type="text"
            placeholder="Search questions by title, difficulty, or Wiz product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="modal-body">
          {currentQuestions.length > 0 ? (
            <div className="questions-table">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>Select</th>
                    <th>Title</th>
                    <th style={{ width: '100px' }}>Difficulty</th>
                    <th style={{ width: '100px' }}>Points</th>
                    <th style={{ width: '120px' }}>Wiz Product</th>
                  </tr>
                </thead>
                <tbody>
                  {currentQuestions.map(question => (
                    <tr key={question._id}>
                      <td>
                        <input
                          type="checkbox"
                          id={`modal-question-${question._id}`}
                          checked={localSelectedIds.includes(question._id)}
                          onChange={() => handleQuestionCheckboxChange(question._id)}
                        />
                      </td>
                      <td className="question-title">
                        <label htmlFor={`modal-question-${question._id}`}>
                          {question.title}
                        </label>
                      </td>
                      <td>
                        <span className={`badge badge-${question.difficulty}`}>
                          {question.difficulty}
                        </span>
                      </td>
                      <td>{question.points}</td>
                      <td>{question.wizProduct}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="no-questions-message">
              {availableQuestions.length === 0 
                ? "No questions available. All questions are already assigned to other categories."
                : "No questions match your search criteria."}
            </p>
          )}
        </div>
        
        {filteredQuestions.length > questionsPerPage && (
          <div className="modal-pagination">
            <button 
              onClick={() => goToPage(currentPage - 1)} 
              disabled={currentPage === 1}
            >
              &laquo; Previous
            </button>
            
            <span className="page-info">
              Page {currentPage} of {totalPages}
            </span>
            
            <button 
              onClick={() => goToPage(currentPage + 1)} 
              disabled={currentPage === totalPages}
            >
              Next &raquo;
            </button>
          </div>
        )}
        
        <div className="selected-count">
          {localSelectedIds.length} question(s) selected
        </div>
        
        <div className="modal-footer">
          <button className="btn btn-light" onClick={onClose}>Cancel</button>
          <button className="btn" onClick={handleSave}>Save Selections</button>
        </div>
      </div>
    </div>
  );
};

export default QuestionSelectionModal;