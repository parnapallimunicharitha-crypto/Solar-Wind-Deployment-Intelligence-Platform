import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// ── Attach JWT token to every request ────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Auto-logout on 401 ────────────────────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),

  login: (username, password) => {
    const formData = new URLSearchParams()
    formData.append('username', username)
    formData.append('password', password)
    return api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  },

  /** GET /auth/profile — returns the current authenticated user */
  profile: () => api.get('/auth/profile'),

  /** GET /auth/google/config — returns if Google login is configured and lists missing variables */
  googleConfig: () => api.get('/auth/google/config'),

  /** PUT /auth/profile — update display name and/or email */
  updateProfile: (data) => api.put('/auth/profile', data),

  /** PUT /auth/change-password — change current user's password */
  changePassword: (data) => api.put('/auth/change-password', data),

  /** GET /auth/users — all registered users (admin directory) */
  users: () => api.get('/auth/users'),
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardAPI = {
  summary:        () => api.get('/dashboard/summary'),
  stats:          () => api.get('/dashboard/stats'),
  charts:         () => api.get('/dashboard/charts'),
  recentProjects: () => api.get('/dashboard/recent-projects'),
  recentSites:    () => api.get('/dashboard/recent-sites'),
}

// ── Projects ──────────────────────────────────────────────────────────────────
export const projectsAPI = {
  getAll:  ()          => api.get('/projects/'),
  getById: (id)        => api.get(`/projects/${id}`),
  create:  (data)      => api.post('/projects/', data),
  update:  (id, data)  => api.put(`/projects/${id}`, data),
  delete:  (id)        => api.delete(`/projects/${id}`),
}

// ── Sites ─────────────────────────────────────────────────────────────────────
export const sitesAPI = {
  getAll:  (projectId) =>
    api.get('/sites/', { params: projectId ? { project_id: projectId } : {} }),
  getById: (id)        => api.get(`/sites/${id}`),
  create:  (data)      => api.post('/sites/', data),
  update:  (id, data)  => api.put(`/sites/${id}`, data),
  delete:  (id)        => api.delete(`/sites/${id}`),
}

// ── Features ──────────────────────────────────────────────────────────────────
export const featuresAPI = {
  getAll:       ()             => api.get('/features/'),
  getById:      (id)           => api.get(`/features/${id}`),
  getByLocation:(lat, lon)     => api.get('/features/location', { params: { latitude: lat, longitude: lon } }),
  create:       (data)         => api.post('/features/create', data),
}

// ── Assessment ────────────────────────────────────────────────────────────────
export const assessmentAPI = {
  getAssessment: (lat, lon) =>
    api.get('/assessment', { params: { latitude: lat, longitude: lon } }),
  estimateEnergy: (data) =>
    api.post('/assessment/energy-estimate', data),
}


// ── Reports ───────────────────────────────────────────────────────────────────
export const reportsAPI = {
  create:  (title, siteId, reportType = 'Assessment') =>
    api.post('/reports/', { title, site_id: siteId, report_type: reportType }),
  getAll:  ()    => api.get('/reports/'),
  getById: (id)  => api.get(`/reports/${id}`),
}

// ── Pipeline ──────────────────────────────────────────────────────────────────
export const pipelineAPI = {
  runPipeline:         (data) => api.post('/pipeline/run', data),
  optimizeDeployment:  (data) => api.post('/pipeline/optimize', data),
  forecastEnergy:      (data) => api.post('/pipeline/forecast', data),
  calculateInvestment: (data) => api.post('/pipeline/investment', data),
}

export default api

