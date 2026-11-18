import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import ErrorMessage from '../components/ErrorMessage'
import useAuth from '../context/useAuth'

export default function LoginPage() {
    const { login } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [form, setForm] = useState({ email: '', password: '' })
    const [error, setError] = useState(null)
    const [busy, setBusy] = useState(false)

    const submit = async (e) => {
        e.preventDefault()
        setBusy(true)
        setError(null)
        try {
            const user = await login(form.email, form.password)
            navigate(location.state?.from || (user.role === 'admin' ? '/admin/rentals' : '/'), { replace: true })
        } catch (err) {
            setError(err)
            setBusy(false)
        }
    }

    return (
        <div className="card narrow">
            <h1>Вхід</h1>
            <form onSubmit={submit} className="form">
                <label>
                    Email
                    <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </label>
                <label>
                    Пароль
                    <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                </label>
                <ErrorMessage error={error} />
                <button className="btn" disabled={busy}>
                    {busy ? 'Вхід…' : 'Увійти'}
                </button>
            </form>
            <p className="muted">
                Немає акаунта? <Link to="/register">Зареєструватися</Link>
            </p>
        </div>
    )
}