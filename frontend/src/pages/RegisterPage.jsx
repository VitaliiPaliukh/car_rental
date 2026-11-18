import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ErrorMessage from '../components/ErrorMessage'
import useAuth from '../context/useAuth'

const FIELDS = [
    ['full_name', 'ПІБ', 'text'],
    ['phone', 'Телефон', 'tel'],
    ['address', 'Адреса', 'text'],
    ['email', 'Email', 'email'],
    ['password', 'Пароль (мінімум 6 символів)', 'password'],
]

export default function RegisterPage() {
    const { register } = useAuth()
    const navigate = useNavigate()
    const [form, setForm] = useState({ full_name: '', phone: '', address: '', email: '', password: '' })
    const [error, setError] = useState(null)
    const [busy, setBusy] = useState(false)

    const submit = async (e) => {
        e.preventDefault()
        setBusy(true)
        setError(null)
        try {
            await register(form)
            navigate('/', { replace: true })
        } catch (err) {
            setError(err)
            setBusy(false)
        }
    }

    return (
        <div className="card narrow">
            <h1>Реєстрація</h1>
            <form onSubmit={submit} className="form">
                {FIELDS.map(([name, label, type]) => (
                    <label key={name}>
                        {label}
                        <input type={type} required value={form[name]} onChange={(e) => setForm({ ...form, [name]: e.target.value })} />
                    </label>
                ))}
                <ErrorMessage error={error} />
                <button className="btn" disabled={busy}>
                    {busy ? 'Реєстрація…' : 'Зареєструватися'}
                </button>
            </form>
            <p className="muted">
                Вже є акаунт? <Link to="/login">Увійти</Link>
            </p>
        </div>
    )
}