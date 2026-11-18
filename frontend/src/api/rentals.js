import { request } from './client'

export const options = () => request('/api/rentals/options')
export const quote = (data) => request('/api/rentals/quote', { method: 'POST', body: data })
export const mine = () => request('/api/rentals/my')
export const list = (params) => request('/api/rentals', { params })
export const create = (data) => request('/api/rentals', { method: 'POST', body: data })
export const issue = (id) => request(`/api/rentals/${id}/issue`, { method: 'POST' })
export const giveBack = (id, data) =>
    request(`/api/rentals/${id}/return`, { method: 'POST', body: data })
export const cancel = (id) => request(`/api/rentals/${id}/cancel`, { method: 'POST' })