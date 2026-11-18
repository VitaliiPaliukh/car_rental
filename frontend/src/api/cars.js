import { request } from './client'

export const list = (params) => request('/api/cars', { params })
export const available = (start, end) => request('/api/cars/available', { params: { start, end } })
export const get = (id) => request(`/api/cars/${id}`)
export const create = (data) => request('/api/cars', { method: 'POST', body: data })
export const update = (id, data) => request(`/api/cars/${id}`, { method: 'PATCH', body: data })
export const remove = (id) => request(`/api/cars/${id}`, { method: 'DELETE' })