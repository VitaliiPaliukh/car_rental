import { useState } from 'react'
import * as carsApi from '../../api/cars'
import * as clientsApi from '../../api/clients'
import * as rentalsApi from '../../api/rentals'
import ErrorMessage from '../../components/ErrorMessage'
import StatusBadge from '../../components/StatusBadge'
import useApi from '../../hooks/useApi'
import {
    DAMAGE_LEVELS,
    OPTION_LABELS,
    RENTAL_STATUSES,
    formatDate,
    formatMoney,
    todayISO,
} from '../../utils'

// ---------- форма нової оренди (адмін оформлює її для клієнта) ----------
function NewRentalForm({ cars, clients, onCreated, onCancel }) {
    const [form, setForm] = useState({
        client_id: clients[0]?.id || '',
        car_id: cars[0]?.id || '',
        issue_date: todayISO(),
        expected_return_date: todayISO(3),
    })
    const [chosen, setChosen] = useState([])
    const [error, setError] = useState(null)
    const [busy, setBusy] = useState(false)
    const { data: options } = useApi(() => rentalsApi.options(), 'options')
    const set = (name) => (e) => setForm({ ...form, [name]: e.target.value })

    const submit = async (e) => {
        e.preventDefault()
        setBusy(true)
        setError(null)
        try {
            await rentalsApi.create({
                client_id: Number(form.client_id),
                car_id: Number(form.car_id),
                issue_date: form.issue_date,
                expected_return_date: form.expected_return_date,
                options: chosen,
            })
            onCreated()
        } catch (err) {
            setError(err)
            setBusy(false)
        }
    }

    return (
        <form className="card form" onSubmit={submit}>
            <h2>Нова оренда</h2>
            <div className="form-row">
                <label>
                    Клієнт
                    <select required value={form.client_id} onChange={set('client_id')}>
                        {clients.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.full_name} ({c.phone})
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    Авто
                    <select required value={form.car_id} onChange={set('car_id')}>
                        {cars.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.brand} {c.model} ({c.year})
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    Видача
                    <input type="date" required value={form.issue_date} onChange={set('issue_date')} />
                </label>
                <label>
                    Повернення
                    <input type="date" required value={form.expected_return_date} onChange={set('expected_return_date')} />
                </label>
            </div>
            <div>
                {options &&
                    Object.keys(options).map((name) => (
                        <label key={name} className="check inline">
                            <input
                                type="checkbox"
                                checked={chosen.includes(name)}
                                onChange={() => setChosen((p) => (p.includes(name) ? p.filter((o) => o !== name) : [...p, name]))}
                            />
                            {OPTION_LABELS[name] || name}
                        </label>
                    ))}
            </div>
            <ErrorMessage error={error} />
            <div className="actions">
                <button className="btn" disabled={busy}>
                    Створити
                </button>
                <button type="button" className="btn btn-secondary" onClick={onCancel}>
                    Скасувати
                </button>
            </div>
        </form>
    )
}

// ---------- форма повернення авто (запускає ланцюжок перевірок зі штрафами) ----------
function ReturnForm({ rental, carName, onDone, onCancel }) {
    const [form, setForm] = useState({ return_date: todayISO(), damage: 'none', is_clean: true, fuel_percent: 100 })
    const [error, setError] = useState(null)
    const [busy, setBusy] = useState(false)

    const submit = async (e) => {
        e.preventDefault()
        setBusy(true)
        setError(null)
        try {
            const result = await rentalsApi.giveBack(rental.id, {
                return_date: form.return_date,
                damage: form.damage,
                is_clean: form.is_clean,
                fuel_percent: Number(form.fuel_percent),
            })
            onDone(result)
        } catch (err) {
            setError(err)
            setBusy(false)
        }
    }

    return (
        <form className="card form" onSubmit={submit}>
            <h2>
                Повернення авто — оренда №{rental.id} ({carName})
            </h2>
            <div className="form-row">
                <label>
                    Дата повернення
                    <input type="date" required value={form.return_date} onChange={(e) => setForm({ ...form, return_date: e.target.value })} />
                </label>
                <label>
                    Пошкодження
                    <select value={form.damage} onChange={(e) => setForm({ ...form, damage: e.target.value })}>
                        {Object.entries(DAMAGE_LEVELS).map(([v, l]) => (
                            <option key={v} value={v}>
                                {l}
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    Пальне, %
                    <input type="number" min="0" max="100" value={form.fuel_percent} onChange={(e) => setForm({ ...form, fuel_percent: e.target.value })} />
                </label>
            </div>
            <label className="check">
                <input type="checkbox" checked={form.is_clean} onChange={(e) => setForm({ ...form, is_clean: e.target.checked })} />
                Авто повернули чистим
            </label>
            <ErrorMessage error={error} />
            <div className="actions">
                <button className="btn" disabled={busy}>
                    Прийняти авто
                </button>
                <button type="button" className="btn btn-secondary" onClick={onCancel}>
                    Скасувати
                </button>
            </div>
        </form>
    )
}

function ReturnResult({ result, onClose }) {
    return (
        <div className="card result">
            <h2>Оренду №{result.rental.id} закрито</h2>
            {result.rental.fines.length === 0 ? (
                <p>Штрафів немає.</p>
            ) : (
                <ul>
                    {result.rental.fines.map((f) => (
                        <li key={f.id}>
                            {f.reason}: <strong>{formatMoney(f.amount)}</strong>
                        </li>
                    ))}
                </ul>
            )}
            <p>Сума штрафів: <strong>{formatMoney(result.fines_total)}</strong></p>
            <p>Повернути клієнту із застави: <strong>{formatMoney(result.deposit_refund)}</strong></p>
            {Number(result.extra_to_pay) > 0 && (
                <p className="text-danger">Клієнт має доплатити: <strong>{formatMoney(result.extra_to_pay)}</strong></p>
            )}
            <button className="btn btn-secondary" onClick={onClose}>
                Закрити
            </button>
        </div>
    )
}

export default function AdminRentalsPage() {
    const [status, setStatus] = useState('')
    const [showNew, setShowNew] = useState(false)
    const [returning, setReturning] = useState(null)
    const [result, setResult] = useState(null)
    const [actionError, setActionError] = useState(null)

    const { data, error, loading, reload } = useApi(async () => {
        const [rentals, cars, clients] = await Promise.all([
            rentalsApi.list({ status }),
            carsApi.list(),
            clientsApi.list(),
        ])
        return {
            rentals,
            cars,
            clients,
            carById: Object.fromEntries(cars.map((c) => [c.id, c])),
            clientById: Object.fromEntries(clients.map((c) => [c.id, c])),
        }
    }, `admin-rentals:${status}`)

    const act = async (fn) => {
        setActionError(null)
        try {
            await fn()
            reload()
        } catch (e) {
            setActionError(e)
        }
    }

    const carName = (id) => {
        const car = data?.carById[id]
        return car ? `${car.brand} ${car.model}` : `#${id}`
    }

    return (
        <>
            <div className="page-head">
                <h1>Оренди</h1>
                {!showNew && data && (
                    <button className="btn" onClick={() => setShowNew(true)}>
                        + Нова оренда
                    </button>
                )}
            </div>

            {result && <ReturnResult result={result} onClose={() => setResult(null)} />}

            {showNew && data && (
                <NewRentalForm
                    cars={data.cars}
                    clients={data.clients}
                    onCancel={() => setShowNew(false)}
                    onCreated={() => {
                        setShowNew(false)
                        reload()
                    }}
                />
            )}

            {returning && data && (
                <ReturnForm
                    key={returning.id}
                    rental={returning}
                    carName={carName(returning.car_id)}
                    onCancel={() => setReturning(null)}
                    onDone={(res) => {
                        setReturning(null)
                        setResult(res)
                        reload()
                    }}
                />
            )}

            <div className="card filters">
                <label>
                    Статус
                    <select value={status} onChange={(e) => setStatus(e.target.value)}>
                        <option value="">Усі</option>
                        {Object.entries(RENTAL_STATUSES).map(([v, l]) => (
                            <option key={v} value={v}>
                                {l}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            <ErrorMessage error={error} />
            <ErrorMessage error={actionError} />
            {loading && !data && <p className="muted">Завантаження…</p>}
            {data && data.rentals.length === 0 && <p className="muted">Оренд не знайдено.</p>}
            {data && data.rentals.length > 0 && (
                <table className="table">
                    <thead>
                    <tr>
                        <th>№</th>
                        <th>Клієнт</th>
                        <th>Авто</th>
                        <th>Період</th>
                        <th className="num">Вартість</th>
                        <th>Статус</th>
                        <th>Штрафи</th>
                        <th />
                    </tr>
                    </thead>
                    <tbody>
                    {data.rentals.map((r) => (
                        <tr key={r.id}>
                            <td>{r.id}</td>
                            <td>{data.clientById[r.client_id]?.full_name || `#${r.client_id}`}</td>
                            <td>{carName(r.car_id)}</td>
                            <td>
                                {formatDate(r.issue_date)} — {formatDate(r.actual_return_date || r.expected_return_date)}
                            </td>
                            <td className="num">{formatMoney(r.total_cost)}</td>
                            <td>
                                <StatusBadge status={r.status} />
                            </td>
                            <td>
                                {r.fines.length === 0
                                    ? '—'
                                    : formatMoney(r.fines.reduce((sum, f) => sum + Number(f.amount), 0))}
                            </td>
                            <td className="actions">
                                {r.status === 'reserved' && (
                                    <>
                                        <button className="btn btn-sm" onClick={() => act(() => rentalsApi.issue(r.id))}>
                                            Видати
                                        </button>
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => window.confirm('Скасувати бронювання?') && act(() => rentalsApi.cancel(r.id))}
                                        >
                                            Скасувати
                                        </button>
                                    </>
                                )}
                                {(r.status === 'active' || r.status === 'overdue') && (
                                    <button className="btn btn-sm" onClick={() => setReturning(r)}>
                                        Прийняти
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </>
    )
}