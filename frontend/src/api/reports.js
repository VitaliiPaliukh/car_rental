import { request } from './client'

export const availability = () => request('/api/reports/availability')
export const financial = (params) => request('/api/reports/financial', { params })