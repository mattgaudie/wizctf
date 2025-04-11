import React, { useState, useEffect } from 'react';
import * as eventService from '../../services/event.service.js';
import * as questionSetService from '../../services/questionSet.service.js';
import './EventsManager.css';

const EventsManager = () => {
  const [events, setEvents] = useState([]);
  const [questionSets, setQuestionSets] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [alert, setAlert] = useState({
    msg: '',
    type: ''
  });
  const [imagePreview, setImagePreview] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    questionSet: '',
    eventCode: '',
    eventDate: '',
    eventTime: '09:00',
    duration: 60,
    eventImage: null,
    active: true
  });

  const { 
    name, 
    description, 
    questionSet, 
    eventCode, 
    eventDate, 
    eventTime, 
    duration, 
    active 
  } = formData;

  useEffect(() => {
    fetchEvents();
    fetchQuestionSets();
  }, []);

  const fetchEvents = async () => {
    try {
      const data = await eventService.getAllEvents();
      setEvents(data);
    } catch (err) {
      setAlert({ msg: err.response?.data?.msg || 'Error fetching events', type: 'danger' });
    }
  };

  const fetchQuestionSets = async () => {
    try {
      const data = await questionSetService.getAllQuestionSets();
      setQuestionSets(data.filter(qs => qs.active));
    } catch (err) {
      setAlert({ msg: err.response?.data?.msg || 'Error fetching question sets', type: 'danger' });
    }
  };

  const onChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    
    if (e.target.name === 'eventImage') {
      if (e.target.files && e.target.files[0]) {
        setFormData({ ...formData, eventImage: e.target.files[0] });
        
        // Create preview URL
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target.result);
        };
        reader.readAsDataURL(e.target.files[0]);
      }
    } else {
      setFormData({ ...formData, [e.target.name]: value });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      questionSet: '',
      eventCode: '',
      eventDate: '',
      eventTime: '09:00',
      duration: 60,
      eventImage: null,
      active: true
    });
    setIsEdit(false);
    setSelectedEvent(null);
    setImagePreview(null);
  };

  const onSelectEvent = (event) => {
    setSelectedEvent(event);
    
    // Extract time from the date
    const eventDateTime = new Date(event.eventDate);
    const hours = String(eventDateTime.getHours()).padStart(2, '0');
    const minutes = String(eventDateTime.getMinutes()).padStart(2, '0');
    const timeString = `${hours}:${minutes}`;
    
    // Format date for input element (YYYY-MM-DD)
    const year = eventDateTime.getFullYear();
    const month = String(eventDateTime.getMonth() + 1).padStart(2, '0');
    const day = String(eventDateTime.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    setFormData({
      name: event.name || '',
      description: event.description || '',
      questionSet: event.questionSet?._id || '',
      eventCode: event.eventCode || '',
      eventDate: dateString,
      eventTime: timeString,
      duration: event.duration || 60,
      eventImage: event.imagePath || null,
      active: event.active !== undefined ? event.active : true
    });
    
    if (event.imagePath) {
      setImagePreview(event.imagePath);
    } else {
      setImagePreview(null);
    }
    
    setIsEdit(true);
  };

  const generateEventCode = () => {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing characters like I, O, 0, 1
    let result = '';
    const length = 6;
    
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    setFormData({ ...formData, eventCode: result });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Combine date and time fields
      const combinedDateTime = new Date(`${eventDate}T${eventTime}`);
      const eventDataToSubmit = {
        ...formData,
        eventDate: combinedDateTime.toISOString()
      };
      
      if (isEdit && selectedEvent) {
        // Update existing event
        await eventService.updateEvent(selectedEvent._id, eventDataToSubmit);
        setAlert({ msg: 'Event updated successfully', type: 'success' });
      } else {
        // Create new event
        await eventService.createEvent(eventDataToSubmit);
        setAlert({ msg: 'Event created successfully', type: 'success' });
      }
      
      // Refresh events list
      fetchEvents();
      resetForm();
    } catch (err) {
      setAlert({ msg: err.response?.data?.msg || 'Error processing event', type: 'danger' });
    }
  };

  const onDelete = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await eventService.deleteEvent(eventId);
        setAlert({ msg: 'Event deleted successfully', type: 'success' });
        
        // Refresh events list
        fetchEvents();
        if (selectedEvent && selectedEvent._id === eventId) {
          resetForm();
        }
      } catch (err) {
        setAlert({ msg: err.response?.data?.msg || 'Error deleting event', type: 'danger' });
      }
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="events-manager">
      <h2>Event Management</h2>
      
      {alert.msg && (
        <div className={`alert alert-${alert.type}`}>
          {alert.msg}
        </div>
      )}
      
      <div className="events-grid">
        <div className="events-form card">
          <h3>{isEdit ? 'Edit Event' : 'Create Event'}</h3>
          <form onSubmit={onSubmit}>
            <div className="form-group">
              <label htmlFor="name">Event Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={name}
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
            
            <div className="form-group">
              <label htmlFor="questionSet">Question Set</label>
              <select
                id="questionSet"
                name="questionSet"
                value={questionSet}
                onChange={onChange}
                required
              >
                <option value="">Select a Question Set</option>
                {questionSets.map(qs => (
                  <option key={qs._id} value={qs._id}>{qs.title}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="eventCode">Event Code</label>
              <div className="event-code-input">
                <input
                  type="text"
                  id="eventCode"
                  name="eventCode"
                  value={eventCode}
                  onChange={onChange}
                  required
                />
                <button 
                  type="button" 
                  className="btn btn-sm"
                  onClick={generateEventCode}
                >
                  Generate
                </button>
              </div>
              <small className="form-text">
                This code will be used by participants to join the event
              </small>
            </div>
            
            <div className="form-row">
              <div className="form-group form-group-half">
                <label htmlFor="eventDate">Event Date</label>
                <input
                  type="date"
                  id="eventDate"
                  name="eventDate"
                  value={eventDate}
                  onChange={onChange}
                  required
                />
              </div>
              
              <div className="form-group form-group-half">
                <label htmlFor="eventTime">Event Time</label>
                <input
                  type="time"
                  id="eventTime"
                  name="eventTime"
                  value={eventTime}
                  onChange={onChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="duration">Duration (minutes)</label>
              <input
                type="number"
                id="duration"
                name="duration"
                value={duration}
                onChange={onChange}
                min="1"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="eventImage">Event Image</label>
              <input
                type="file"
                id="eventImage"
                name="eventImage"
                accept="image/*"
                onChange={onChange}
              />
              {imagePreview && (
                <div className="image-preview">
                  <img 
                    src={imagePreview.startsWith('data:') ? imagePreview : `/uploads/events/${imagePreview}`} 
                    alt="Event preview" 
                  />
                </div>
              )}
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
            
            <div className="event-form-buttons">
              <button type="submit" className="btn">
                {isEdit ? 'Update Event' : 'Create Event'}
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
        
        <div className="events-list card">
          <h3>Events</h3>
          {events.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Date</th>
                  <th>Question Set</th>
                  <th>Code</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event._id} className={event.active ? '' : 'event-inactive'}>
                    <td>{event.name}</td>
                    <td>{formatDate(event.eventDate)}</td>
                    <td>{event.questionSet?.title || 'N/A'}</td>
                    <td><code>{event.eventCode}</code></td>
                    <td>
                      <span className={`badge ${event.active ? 'badge-success' : 'badge-danger'}`}>
                        {event.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button
                        className="btn btn-sm"
                        onClick={() => onSelectEvent(event)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => onDelete(event._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="no-data-message">No events found. Create your first event!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventsManager;