import { useState } from 'react'
import * as carsApi from '../../api/cars'
import ErrorMessage from '../../components/ErrorMessage'
import StatusBadge from '../../components/StatusBadge'
import useApi from '../../hooks/useApi'
import { CAR_STATUSES, CAR_TYPES, formatMoney } from '../../utils'

const EMPTY = {
    brand: '',
    model: '',
    type: 'economy',
    year: new Date().getFullYear(),
    price_per_day: '',
    deposit: '',
    status: 'available',
}

function CarForm({ initial, onSaved, onCancel }) {
    const editing = Boolean(initial.id)
    const [form, setForm] = useState(initial)
    const [error, setError] = useState(null)
    const [busy, setBusy] = useState(false)
    const set = (name) => (e) => setForm({ ...form, [name]: e.target.value })

    const submit = async (e) => {
        e.preventDefault()
        setBusy(true)
        setError(null)
        const payload = {
            brand: form.brand,
            model: form.model,
            type: form.type,
            year: Number(form.year),
            price_per_day: Number(form.price_per_day),
        }
        // порожня застава: бекенд порахує її за типом авто (Factory Method)
        if (form.deposit !== '' && form.deposit !== null) payload.deposit = Number(form.deposit)
        try {
            if (editing) await carsApi.update(initial.id, { ...payload, status: form.status })
            else await carsApi.create(payload)
            onSaved()
        } catch (err) {
            setError(err)
            setBusy(false)
        }
    }

    return (
        <form className="card form" onSubmit={submit}>
            <h2>{editing ? `Редагування авто №${initial.id}` : 'Нове авто'}</h2>
            <div className="form-row">
                <label>
                    Марка
                    <input required value={form.brand} onChange={set('brand')} />
                </label>
                <label>
                    Модель
                    <input required value={form.model} onChange={set('model')} />
                </label>
                <label>
                    Тип
                    <select value={form.type} onChange={set('type')}>
                        {Object.entries(CAR_TYPES).map(([v, l]) => (
                            <option key={v} value={v}>
                                {l}
                            </option>
                        ))}
                    </select>
                </label>
            </div>
            <div className="form-row">
                <label>
                    Рік випуску
                    <input type="number" required min="1990" max="2100" value={form.year} onChange={set('year')} />
                </label>
                <label>
                    Ціна за добу
                    <input type="number" required min="0.01" step="0.01" value={form.price_per_day} onChange={set('price_per_day')} />
                </label>
                <label>
                    Застава (порожньо = за типом)
                    <input type="number" min="0" step="0.01" value={form.deposit} onChange={set('deposit')} />
                </label>
                {editing && (
                    <label>
                        Статус
                        <select value={form.status} onChange={set('status')}>
                            {Object.entries(CAR_STATUSES).map(([v, l]) => (
                                <option key={v} value={v}>
                                    {l}
                                </option>
                            ))}
                        </select>
                    </label>
                )}
            </div>
            <ErrorMessage error={error} />
            <div className="actions">
                <button className="btn" disabled={busy}>
                    Зберегти
                </button>
                <button type="button" className="btn btn-secondary" onClick={onCancel}>
                    Скасувати
                </button>
            </div>
        </form>
    )
}

export default function AdminCarsPage() {
    const [editing, setEditing] = useState(null) // null | об'єкт авто | EMPTY
    const [actionError, setActionError] = useState(null)
    const { data: cars, error, loading, reload } = useApi(() => carsApi.list(), 'admin-cars')

    const remove = async (car) => {
        if (!window.confirm(`Видалити ${car.brand} ${car.model}?`)) return
        setActionError(null)
        try {
            await carsApi.remove(car.id)
            reload()
        } catch (e) {
            setActionError(e)
        }
    }

    return (
        <>
            <div className="page-head">
                <h1>Автопарк</h1>
                {!editing && (
                    <button className="btn" onClick={() => setEditing(EMPTY)}>
                        + Додати авто
                    </button>
                )}
            </div>

            {editing && (
                <CarForm
                    key={editing.id || 'new'}
                    initial={editing}
                    onCancel={() => setEditing(null)}
                    onSaved={() => {
                        setEditing(null)
                        reload()
                    }}
                />
            )}

            <ErrorMessage error={error} />
            <ErrorMessage error={actionError} />
            {loading && !cars && <p className="muted">Завантаження…</p>}
            {cars && (
                <table className="table">
                    <thead>
                    <tr>
                        <th>№</th>
                        <th>Авто</th>
                        <th>Тип</th>
                        <th>Рік</th>
                        <th className="num">Ціна / доба</th>
                        <th className="num">Застава</th>
                        <th>Статус</th>
                        <th />
                    </tr>
                    </thead>
                    <tbody>
                    {cars.map((c) => (
                        <tr key={c.id}>
                            <td>{c.id}</td>
                            <td>
                                {c.brand} {c.model}
                            </td>
                            <td>{CAR_TYPES[c.type]}</td>
                            <td>{c.year}</td>
                            <td className="num">{formatMoney(c.price_per_day)}</td>
                            <td className="num">{formatMoney(c.deposit)}</td>
                            <td>
                                <StatusBadge status={c.status} />
                            </td>
                            <td className="actions">
                                <button className="btn btn-secondary btn-sm" onClick={() => setEditing(c)}>
                                    Редагувати
                                </button>
                                <button className="btn btn-danger btn-sm" onClick={() => remove(c)}>
                                    Видалити
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </>
    )
}