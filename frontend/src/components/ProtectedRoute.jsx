import { Navigate, useLocation } from 'react-router-dom'
import useAuth from '../context/useAuth'

/** Пускає лише авторизованих; якщо вказано role - лише користувачів із цією роллю. */
export default function ProtectedRoute({ role, children }) {
    const { user, loading } = useAuth()
    const location = useLocation()

    if (loading) return <p className="muted">Завантаження…</p>
    if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
    if (role && user.role !== role) {
        return <div className="alert alert-error">Недостатньо прав для перегляду цієї сторінки.</div>
    }
    return children
}