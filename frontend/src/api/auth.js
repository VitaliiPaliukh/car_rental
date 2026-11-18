import { request } from './client'

export const register = (data) => request('/api/auth/register', { method: 'POST', body: data })
export const login = (email, password) =>
    request('/api/auth/login', { method: 'POST', body: { email, password } })
export const me = () => request('/api/auth/me')