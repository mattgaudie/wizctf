import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import MainLayout from '../components/layout/MainLayout.js';
import * as eventService from '../services/event.service.js';
import './DashboardPage.css';
import './EventsPage.css';
import './modal.css';

const EventsPage = () => {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState({ upcoming: [], past: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eventCode, setEventCode] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [joinError, setJoinError] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Redirect if not authenticated
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    } else {
      fetchEvents();
    }
  }, [isAuthenticated, authLoading, navigate]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      
      // Use Promise.all to fetch both user events and active events in parallel
      const [userEventsData, activeEventsData] = await Promise.all([
        eventService.getUserEvents(),
        eventService.getActiveEvents()
      ]);
      
      // Save the user's events IDs to identify which events the user is registered for
      const userEventIds = userEventsData.map(event => event._id);
      
      // Combine and deduplicate events
      const eventMap = new Map();
      
      // First add user events (these take precedence)
      userEventsData.forEach(event => {
        event.isRegistered = true;
        eventMap.set(event._id, event);
      });
      
      // Then add active events that the user is not already part of
      activeEventsData.forEach(event => {
        if (!eventMap.has(event._id)) {
          event.isRegistered = userEventIds.includes(event._id);
          eventMap.set(event._id, event);
        }
      });
      
      // Convert map to array
      const allEvents = Array.from(eventMap.values());
      
      // Separate into upcoming and past events
      const now = new Date();
      const upcoming = [];
      const past = [];
      
      allEvents.forEach(event => {
        const eventDate = new Date(event.eventDate);
        if (eventDate > now) {
          upcoming.push(event);
        } else {
          past.push(event);
        }
      });
      
      // Sort upcoming events by date (closest first)
      upcoming.sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));
      
      // Sort past events by date (most recent first)
      past.sort((a, b) => new Date(b.eventDate) - new Date(a.eventDate));
      
      setEvents({ upcoming, past });
      
      // Log what we found
      console.log(`Found ${upcoming.length} upcoming and ${past.length} past events`);
    } catch (err) {
      setError('Failed to load events. Please try again later.');
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinEvent = async (e) => {
    e.preventDefault();
    
    if (!eventCode.trim()) {
      setJoinError('Please enter an event code');
      return;
    }
    
    try {
      setJoinError(null);
      
      // Use the event service to join the event
      const data = await eventService.joinEvent(eventCode);
      
      // Clear the input and close the modal
      setEventCode('');
      closeModal();
      
      // Show success message
      alert('Successfully joined event: ' + data.event.name);
      
      // Refresh the events list
      await fetchEvents();
      
      // Navigate to the event page
      if (data.event && data.event.id) {
        navigate(`/events/${data.event.id}`);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.msg || 'An error occurred. Please try again.';
      setJoinError(errorMessage);
      console.error('Error joining event:', err);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleEventClick = (event) => {
    // Check if the user is already registered for this event
    if (event.isRegistered) {
      // User is already registered, navigate to event details
      navigate(`/events/${event._id}`);
    } else {
      // User needs to join the event first, show modal
      setSelectedEvent(event);
      setEventCode('');
      setJoinError(null);
      setShowModal(true);
    }
  };
  
  const closeModal = () => {
    setShowModal(false);
    setSelectedEvent(null);
    setEventCode('');
    setJoinError(null);
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

  return (
    <MainLayout>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Events</h1>
          <p>Join and participate in events</p>
        </div>

        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}

        <div className="dashboard-content">
          {/* Upcoming Events */}
          <div className="card dashboard-card">
            <h2>Upcoming Events</h2>
            {events.upcoming.length === 0 ? (
              <p>No upcoming events found.</p>
            ) : (
              <div className="events-list">
                {events.upcoming.map(event => (
                  <div key={event._id} className="event-item" onClick={() => handleEventClick(event)}>
                    <div className="event-image">
                      {event.imagePath ? (
                        <img src={event.imagePath} alt={event.name} />
                      ) : (
                        <div className="event-placeholder">
                          <span>{event.name[0]}</span>
                        </div>
                      )}
                    </div>
                    <div className="event-details">
                      <h3>{event.name}</h3>
                      <p><strong>Date:</strong> {formatDate(event.eventDate)}</p>
                      <p><strong>Duration:</strong> {event.duration} minutes</p>
                      {event.description && (
                        <p className="event-description">{event.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past Events */}
          <div className="card dashboard-card">
            <h2>Past Events</h2>
            {events.past.length === 0 ? (
              <p>No past events found.</p>
            ) : (
              <div className="events-list">
                {events.past.map(event => (
                  <div key={event._id} className="event-item" onClick={() => handleEventClick(event)}>
                    <div className="event-image">
                      {event.imagePath ? (
                        <img src={event.imagePath} alt={event.name} />
                      ) : (
                        <div className="event-placeholder">
                          <span>{event.name[0]}</span>
                        </div>
                      )}
                    </div>
                    <div className="event-details">
                      <h3>{event.name}</h3>
                      <p><strong>Date:</strong> {formatDate(event.eventDate)}</p>
                      <p><strong>Duration:</strong> {event.duration} minutes</p>
                      {event.description && (
                        <p className="event-description">{event.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Event Join Modal */}
      {showModal && selectedEvent && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2>Join Event</h2>
              <button className="modal-close" onClick={closeModal}>&times;</button>
            </div>
            
            <div className="modal-body">
              <div className="event-info">
                {selectedEvent.imagePath ? (
                  <img 
                    src={selectedEvent.imagePath} 
                    alt={selectedEvent.name} 
                    className="event-logo" 
                  />
                ) : (
                  <div className="event-placeholder event-logo">
                    <span>{selectedEvent.name[0]}</span>
                  </div>
                )}
                <h3>{selectedEvent.name}</h3>
                <p><strong>Date:</strong> {formatDate(selectedEvent.eventDate)}</p>
                <p><strong>Duration:</strong> {selectedEvent.duration} minutes</p>
              </div>
              
              <p>Please enter the event code to join:</p>
              
              <form onSubmit={handleJoinEvent}>
                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Enter Event Code"
                    value={eventCode}
                    onChange={(e) => setEventCode(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                
                {joinError && (
                  <div className="alert alert-danger">
                    {joinError}
                  </div>
                )}
                
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={closeModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn">
                    Join Event
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default EventsPage;