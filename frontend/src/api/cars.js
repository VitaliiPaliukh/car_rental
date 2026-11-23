import { request } from './client'

export const list = (params) => request('/api/cars', { params })
export const available = (start, end) => request('/api/cars/available', { params: { start, end } })
export const get = (id) => request(`/api/cars/${id}`)
export const create = (data) => request('/api/cars', { method: 'POST', body: data })
export const update = (id, data) => request(`/api/cars/${id}`, { method: 'PATCH', body: data })
export const remove = (id) => request(`/api/cars/${id}`, { method: 'DELETE' })

export function uploadPhoto(id, file) {
    const form = new FormData()
    form.append('file', file)
    return request(`/api/cars/${id}/photo`, { method: 'POST', body: form })
}
export const removePhoto = (id) => request(`/api/cars/${id}/photo`, { method: 'DELETE' })