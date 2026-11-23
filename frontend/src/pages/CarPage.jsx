import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import * as carsApi from '../api/cars'
import * as rentalsApi from '../api/rentals'
import CarPhoto from '../components/CarPhoto'
import ErrorMessage from '../components/ErrorMessage'
import StatusBadge from '../components/StatusBadge'
import useAuth from '../context/useAuth'
import useApi from '../hooks/useApi'
import { CAR_TYPES, OPTION_LABELS, formatMoney, todayISO } from '../utils'

export default function CarPage() {
    const { id } = useParams()
    const [params] = useSearchParams()
    const navigate = useNavigate()
    const location = useLocation()
    const { user, isAdmin } = useAuth()

    const [start, setStart] = useState(params.get('start') || todayISO(1))
    const [end, setEnd] = useState(params.get('end') || todayISO(4))
    const [chosen, setChosen] = useState([])
    const [submitError, setSubmitError] = useState(null)
    const [submitting, setSubmitting] = useState(false)

    const { data: car, error: carError } = useApi(() => carsApi.get(id), `car:${id}`)
    const { data: options } = useApi(() => rentalsApi.options(), 'options')

    const validDates = Boolean(start && end && end > start)
    const { data: quote, error: quoteError } = useApi(
        () =>
            validDates
                ? rentalsApi.quote({ car_id: Number(id), issue_date: start, expected_return_date: end, options: chosen })
                : Promise.resolve(null),
        `quote:${id}:${start}:${end}:${chosen.join(',')}`,
    )

    const toggleOption = (name) =>
        setChosen((prev) => (prev.includes(name) ? prev.filter((o) => o !== name) : [...prev, name]))

    const book = async () => {
        setSubmitting(true)
        setSubmitError(null)
        try {
            await rentalsApi.create({
                car_id: Number(id),
                issue_date: start,
                expected_return_date: end,
                options: chosen,
            })
            navigate('/my-rentals')
        } catch (e) {
            setSubmitError(e)
            setSubmitting(false)
        }
    }

    if (carError) return <ErrorMessage error={carError} />
    if (!car) return <p className="muted">Завантаження…</p>

    return (
        <>
            <p>
                <Link to="/">← До каталогу</Link>
            </p>
            <div className="two-cols">
                <div className="card">
                    <CarPhoto car={car} className="car-photo-large" />
                    <div className="car-card-top">
                        <span className="car-type">{CAR_TYPES[car.type] || car.type}</span>
                        <StatusBadge status={car.status} />
                    </div>
                    <h1>
                        {car.brand} {car.model}
                    </h1>
                    <p className="muted">{car.year} рік випуску</p>
                    <p className="price">
                        {formatMoney(car.price_per_day)} <small>/ доба</small>
                    </p>
                    <p>Застава: {formatMoney(car.deposit)} (повертається після повернення авто)</p>
                    {car.status === 'maintenance' && (
                        <div className="alert alert-error">Це авто зараз у ремонті й недоступне для оренди.</div>
                    )}
                </div>

                <div className="card">
                    <h2>Оформлення оренди</h2>
                    <div className="form-row">
                        <label>
                            Дата видачі
                            <input type="date" value={start} min={todayISO()} onChange={(e) => setStart(e.target.value)} />
                        </label>
                        <label>
                            Дата повернення
                            <input type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} />
                        </label>
                    </div>

                    <p className="label">Додаткові опції</p>
                    {options &&
                        Object.entries(options).map(([name, price]) => (
                            <label key={name} className="check">
                                <input type="checkbox" checked={chosen.includes(name)} onChange={() => toggleOption(name)} />
                                {OPTION_LABELS[name] || name} (+{formatMoney(price)} / доба)
                            </label>
                        ))}

                    {!validDates && <p className="muted">Дата повернення має бути пізніше за дату видачі.</p>}
                    <ErrorMessage error={quoteError} />
                    {quote && (
                        <table className="table quote">
                            <tbody>
                            {quote.lines.map((line, i) => (
                                <tr key={i}>
                                    <td>{line.description}</td>
                                    <td className="num">{formatMoney(line.amount)}</td>
                                </tr>
                            ))}
                            <tr className="total">
                                <td>Разом за {quote.days} діб</td>
                                <td className="num">{formatMoney(quote.total)}</td>
                            </tr>
                            <tr>
                                <td className="muted">Застава (повертається)</td>
                                <td className="num muted">{formatMoney(quote.deposit)}</td>
                            </tr>
                            </tbody>
                        </table>
                    )}

                    <ErrorMessage error={submitError} />
                    {!user && (
                        <Link className="btn" to="/login" state={{ from: location.pathname + location.search }}>
                            Увійдіть, щоб забронювати
                        </Link>
                    )}
                    {isAdmin && <p className="muted">Адміністратор оформлює оренди в розділі «Оренди».</p>}
                    {user && !isAdmin && (
                        <button className="btn" disabled={!validDates || submitting || car.status === 'maintenance'} onClick={book}>
                            {submitting ? 'Бронювання…' : 'Забронювати'}
                        </button>
                    )}
                </div>
            </div>
        </>
    )
}