import { useCallback, useEffect, useMemo, useState } from 'react'
import * as authApi from '../api/auth'
import { getToken, setToken } from '../api/client'
import { AuthContext } from './auth-context'

export default function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(() => Boolean(getToken()))

    // при старті: якщо є збережений токен - дізнаємось, хто це
    useEffect(() => {
        if (!getToken()) return
        authApi
            .me()
            .then(setUser)
            .catch(() => setToken(null))
            .finally(() => setLoading(false))
    }, [])

    const logout = useCallback(() => {
        setToken(null)
        setUser(null)
    }, [])

    // бекенд відповів 401 -> токен недійсний
    useEffect(() => {
        window.addEventListener('auth:unauthorized', logout)
        return () => window.removeEventListener('auth:unauthorized', logout)
    }, [logout])

    const login = useCallback(async (email, password) => {
        const data = await authApi.login(email, password)
        setToken(data.access_token)
        setUser(data.user)
        return data.user
    }, [])

    const register = useCallback(
        async (form) => {
            await authApi.register(form)
            return login(form.email, form.password)
        },
        [login],
    )

    const value = useMemo(
        () => ({
            user,
            loading,
            login,
            register,
            logout,
            isAdmin: user?.role === 'admin',
            isClient: user?.role === 'client',
        }),
        [user, loading, login, register, logout],
    )

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}