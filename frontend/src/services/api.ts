// API service for backend communication
import axios from 'axios'
import { Project, ECM, CalculationResult } from '../types'

const API_BASE_URL = '/api'

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Project endpoints
export const projectAPI = {
  getAll: () => api.get<Project[]>('/projects'),
  getById: (id: number) => api.get<Project>(`/projects/${id}`),
  create: (data: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => 
    api.post<Project>('/projects', data),
  update: (id: number, data: Partial<Project>) => 
    api.put<Project>(`/projects/${id}`, data),
  delete: (id: number) => api.delete(`/projects/${id}`),
  addECM: (projectId: number, ecmData: { ecm_id: number, custom_savings_percent?: number, custom_implementation_cost?: number }) =>
    api.post(`/projects/${projectId}/ecms`, ecmData)
}

// ECM endpoints
export const ecmAPI = {
  getAll: () => api.get<ECM[]>('/ecms'),
  getTemplates: () => api.get<ECM[]>('/ecms/templates'),
  getById: (id: number) => api.get<ECM>(`/ecms/${id}`),
  create: (data: Omit<ECM, 'id'>) => api.post<ECM>('/ecms', data),
  update: (id: number, data: Partial<ECM>) => api.put<ECM>(`/ecms/${id}`, data),
  delete: (id: number) => api.delete(`/ecms/${id}`)
}

// Calculation endpoints - Updated to handle enable_output.json results
export const calculationAPI = {
  calculateProject: (projectId: number) => 
    api.post<CalculationResult>(`/calculations/project/${projectId}/calculate`),
  quickCalculate: (data: { annual_energy_cost: number, ecms: ECM[] }) =>
    api.post('/calculations/quick-calculate', data),
  getSimulationConfig: (projectId: number, buildingParams?: any) =>
    api.post(`/calculations/project/${projectId}/simulation-config`, buildingParams),
  runSimulation: (projectId: number) =>
    api.post(`/calculations/project/${projectId}/run-simulation`),
  getSimulationResults: (projectId: number) =>
    api.get(`/calculations/project/${projectId}/simulation-results`),
  getECMTemplates: () => api.get('/calculations/ecm-templates')
}

// Health check
export const healthCheck = () => api.get('/health')

export default api