const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
const TOKEN_KEY = 'rental_token'

export const assetUrl = (path) => (path ? BASE_URL + path : null)

export const getToken = () => localStorage.getItem(TOKEN_KEY)

export function setToken(token) {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
    constructor(status, message) {
        super(message)
        this.status = status
    }
}

// FastAPI повертає detail рядком (наші помилки) або масивом (валідація 422)
function formatDetail(detail) {
    if (!detail) return 'Невідома помилка'
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) {
        return detail
            .map((e) => {
                const field = Array.isArray(e.loc) ? e.loc.slice(1).join('.') : ''
                const msg = String(e.msg || '').replace('Value error, ', '')
                return field ? `${field}: ${msg}` : msg
            })
            .join('; ')
    }
    return JSON.stringify(detail)
}

export async function request(path, { method = 'GET', body, params } = {}) {
    const url = new URL(BASE_URL + path)
    Object.entries(params || {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value)
    })

    const headers = {}
    const isForm = typeof FormData !== 'undefined' && body instanceof FormData
    if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json'
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`

    let response
    try {
        response = await fetch(url, {
            method,
            headers,
            body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
        })
    } catch {
        throw new ApiError(0, 'Не вдалося зʼєднатися із сервером. Перевірте, чи запущений бекенд.')
    }

    if (response.status === 204) return null
    const data = await response.json().catch(() => null)

    if (!response.ok) {
        // токен більше не діє -> просимо застосунок вийти з акаунта
        if (response.status === 401 && token) window.dispatchEvent(new Event('auth:unauthorized'))
        throw new ApiError(response.status, formatDetail(data?.detail))
    }
    return data
}