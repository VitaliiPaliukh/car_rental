import { request } from './client'

export const list = (search) => request('/api/clients', { params: { search } })
export const create = (data) => request('/api/clients', { method: 'POST', body: data })
export const update = (id, data) => request(`/api/clients/${id}`, { method: 'PATCH', body: data })
export const remove = (id) => request(`/api/clients/${id}`, { method: 'DELETE' })