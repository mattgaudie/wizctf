import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import MainLayout from '../components/layout/MainLayout.js';
import './DashboardPage.css';
import './EventsPage.css';

const EventsPage = () => {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState({ upcoming: [], past: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eventCode, setEventCode] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [joinError, setJoinError] = useState(null);

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
      
      // Get all events the user is participating in
      const response = await fetch('/api/events/user', {
        headers: {
          'x-auth-token': localStorage.getItem('token')
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      
      const eventsData = await response.json();
      
      // Separate into upcoming and past events
      const now = new Date();
      const upcoming = [];
      const past = [];
      
      eventsData.forEach(event => {
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
    } catch (err) {
      setError('Failed to load events. Please try again later.');
      console.error(err);
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
      
      const response = await fetch('/api/events/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token')
        },
        body: JSON.stringify({ eventCode })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setJoinError(data.msg || 'Failed to join event');
        return;
      }
      
      // Clear the input and refetch events
      setEventCode('');
      fetchEvents();
      
      // Show success message or redirect to event
      // For now, just show a message
      alert('Successfully joined event: ' + data.event.name);
    } catch (err) {
      setJoinError('An error occurred. Please try again.');
      console.error(err);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleEventClick = (event) => {
    // Navigate to event details page where users can see and answer questions
    navigate(`/events/${event._id}`);
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
          {/* Event Join Form */}
          <div className="card dashboard-card">
            <h2>Join an Event</h2>
            <form onSubmit={handleJoinEvent}>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Enter Event Code"
                  value={eventCode}
                  onChange={(e) => setEventCode(e.target.value)}
                  required
                />
              </div>
              
              {joinError && (
                <div className="alert alert-danger">
                  {joinError}
                </div>
              )}
              
              <button type="submit" className="btn">
                Join Event
              </button>
            </form>
          </div>

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
    </MainLayout>
  );
};

export default EventsPage;