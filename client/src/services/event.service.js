import api from './api.service.js';

// Events API endpoints
const EVENTS_PATH = '/events';

// Get all events (admin only)
export const getAllEvents = async () => {
  try {
    const response = await api.get(EVENTS_PATH);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get event by ID (admin only)
export const getEventById = async (eventId) => {
  try {
    const response = await api.get(`${EVENTS_PATH}/${eventId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Create event (admin only)
export const createEvent = async (eventData) => {
  // Use FormData for multipart/form-data (file upload)
  const formData = new FormData();
  
  // Add event data
  Object.keys(eventData).forEach(key => {
    if (key === 'eventImage') {
      if (eventData[key]) {
        formData.append(key, eventData[key]);
      }
    } else if (key === 'eventDate') {
      formData.append(key, new Date(eventData[key]).toISOString());
    } else {
      formData.append(key, eventData[key]);
    }
  });
  
  try {
    const response = await api.post(EVENTS_PATH, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update event (admin only)
export const updateEvent = async (eventId, eventData) => {
  // Use FormData for multipart/form-data (file upload)
  const formData = new FormData();
  
  // Add event data
  Object.keys(eventData).forEach(key => {
    if (key === 'eventImage') {
      if (eventData[key] && typeof eventData[key] !== 'string') {
        formData.append(key, eventData[key]);
      }
    } else if (key === 'eventDate' && eventData[key]) {
      formData.append(key, new Date(eventData[key]).toISOString());
    } else if (eventData[key] !== undefined) {
      formData.append(key, eventData[key]);
    }
  });
  
  try {
    const response = await api.put(`${EVENTS_PATH}/${eventId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete event (admin only)
export const deleteEvent = async (eventId) => {
  try {
    const response = await api.delete(`${EVENTS_PATH}/${eventId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Join event (users)
export const joinEvent = async (eventCode) => {
  try {
    const response = await api.post(`${EVENTS_PATH}/join`, { eventCode });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get event participants (admin only)
export const getEventParticipants = async (eventId) => {
  try {
    const response = await api.get(`${EVENTS_PATH}/${eventId}/participants`);
    return response.data;
  } catch (error) {
    throw error;
  }
};