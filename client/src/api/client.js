const API_BASE = '/api';

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE;
  }

  getToken() {
    const token = localStorage.getItem('ync_token');
    const isAdmin = window.location.pathname.startsWith('/admin');
    // For admin routes, use admin token if available
    if (isAdmin) {
      return localStorage.getItem('ync_admin_token') || token;
    }
    return token;
  }

  async request(endpoint, options = {}) {
    const { method = 'GET', body, params, headers: customHeaders, formData } = options;

    const headers = { ...customHeaders };
    if (!formData) {
      headers['Content-Type'] = 'application/json';
    }

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let url = `${this.baseUrl}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value);
        }
      });
      const qs = searchParams.toString();
      if (qs) url += `?${qs}`;
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: formData || (body ? JSON.stringify(body) : undefined),
      });

      const data = await response.json();

      if (!response.ok) {
        const error = new Error(data.message || 'Request failed');
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (error) {
      if (error.status) throw error;
      throw new Error('Network error. Please check your connection.');
    }
  }

  get(endpoint, params) { return this.request(endpoint, { method: 'GET', params }); }
  post(endpoint, body) { return this.request(endpoint, { method: 'POST', body }); }
  put(endpoint, body) { return this.request(endpoint, { method: 'PUT', body }); }
  patch(endpoint, body) { return this.request(endpoint, { method: 'PATCH', body }); }
  delete(endpoint) { return this.request(endpoint, { method: 'DELETE' }); }

  async upload(endpoint, formData) {
    return this.request(endpoint, { method: 'POST', formData });
  }
}

const api = new ApiClient();

// Auth API — matches server routes exactly
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  firebaseAuth: (idToken) => api.post('/auth/firebase', { idToken }),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/password', data),
  exportData: () => api.get('/auth/export'),
};

// Admin Auth API
export const adminAuthAPI = {
  login: (data) => api.post('/admin/auth/login', data),
  getMe: () => api.get('/admin/auth/me'),
};

// Events API — matches server routes
export const eventsAPI = {
  getAll: (params) => api.get('/events', params),
  getById: (id) => api.get(`/events/${id}`),
  create: (data) => api.post('/events', data),
  update: (id, data) => api.put(`/events/${id}`, data),
  delete: (id) => api.delete(`/events/${id}`),
};

// Bookings API — matches server routes
export const bookingsAPI = {
  create: (data) => api.post('/bookings', data),
  getMy: () => api.get('/bookings/my'),
  getById: (id) => api.get(`/bookings/${id}`),
  cancel: (id) => api.put(`/bookings/${id}/cancel`),
};

// Tickets API — matches server routes
export const ticketsAPI = {
  getMy: () => api.get('/tickets/my'),
  getById: (id) => api.get(`/tickets/${id}`),
  validate: (data) => api.post('/tickets/validate', data),
};

// Memberships API — matches server routes
export const membershipsAPI = {
  request: (data) => api.post('/memberships/request', data),
  getMy: () => api.get('/memberships/my'),
  getAll: (params) => api.get('/memberships', params),
  approve: (id, data) => api.put(`/memberships/${id}/approve`, data),
  reject: (id, data) => api.put(`/memberships/${id}/reject`, data),
  return: (id, data) => api.put(`/memberships/${id}/return`, data),
};

// Notifications API — matches server routes
export const notificationsAPI = {
  getMy: () => api.get('/notifications'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  send: (data) => api.post('/notifications/send', data),
};

// Announcements API — matches server routes
export const announcementsAPI = {
  getAll: (params) => api.get('/announcements', params),
  create: (data) => api.post('/announcements', data),
  update: (id, data) => api.put(`/announcements/${id}`, data),
  delete: (id) => api.delete(`/announcements/${id}`),
};

// Gallery API
export const galleryAPI = {
  getAll: (params) => api.get('/gallery', params),
  upload: (formData) => api.upload('/gallery', formData),
  delete: (id) => api.delete(`/gallery/${id}`),
};

// Contact API
export const contactAPI = {
  send: (data) => api.post('/contact', data),
  getAll: (params) => api.get('/contact', params),
  markRead: (id) => api.put(`/contact/${id}/read`),
};

// Admin API — matches server routes
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', params),
  toggleUser: (id) => api.put(`/admin/users/${id}/toggle`),
  resetPassword: (id, data) => api.put(`/admin/users/${id}/reset-password`, data),
  exportBookings: () => api.get('/admin/export/bookings'),
  exportMemberships: () => api.get('/admin/export/memberships'),
};

// Favorites API
export const favoritesAPI = {
  getAll: () => api.get('/favorites'),
  check: (eventId) => api.get(`/favorites/check/${eventId}`),
  add: (eventId) => api.post(`/favorites/${eventId}`),
  remove: (eventId) => api.delete(`/favorites/${eventId}`),
};

// Waitlist API
export const waitlistAPI = {
  getMy: () => api.get('/waitlist/my'),
  join: (eventId, data) => api.post(`/waitlist/${eventId}`, data),
  leave: (id) => api.delete(`/waitlist/${id}`),
};

// Reviews API
export const reviewsAPI = {
  getByEvent: (eventId) => api.get(`/reviews/event/${eventId}`),
  getMy: () => api.get('/reviews/my'),
  create: (data) => api.post('/reviews', data),
  delete: (id) => api.delete(`/reviews/${id}`),
};

// Feedback API
export const feedbackAPI = {
  getForm: (eventId) => api.get(`/feedback/forms/${eventId}`),
  submit: (formId, data) => api.post(`/feedback/forms/${formId}/respond`, data),
  // Admin
  getAllForms: () => api.get('/feedback/admin/forms'),
  createForm: (data) => api.post('/feedback/admin/forms', data),
  updateForm: (id, data) => api.put(`/feedback/admin/forms/${id}`, data),
  deleteForm: (id) => api.delete(`/feedback/admin/forms/${id}`),
  getResponses: (id) => api.get(`/feedback/admin/forms/${id}/responses`),
};

// Short URLs API
export const shortUrlsAPI = {
  create: (data) => api.post('/short-urls', data),
  getMy: () => api.get('/short-urls/my'),
};

// Push API
export const pushAPI = {
  subscribe: (data) => api.post('/push/subscribe', data),
  unsubscribe: (endpoint) => api.delete('/push/unsubscribe', { endpoint }),
};

// Analytics API (admin)
export const analyticsAPI = {
  getOverview: () => api.get('/admin/analytics/overview'),
  getRevenue: () => api.get('/admin/analytics/revenue'),
  getEvents: () => api.get('/admin/analytics/events'),
  getUsers: () => api.get('/admin/analytics/users'),
};

export default api;
