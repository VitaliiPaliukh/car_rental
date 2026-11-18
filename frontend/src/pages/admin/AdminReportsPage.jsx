import { useState } from 'react'
import * as reportsApi from '../../api/reports'
import ErrorMessage from '../../components/ErrorMessage'
import StatusBadge from '../../components/StatusBadge'
import useApi from '../../hooks/useApi'
import { formatMoney } from '../../utils'

function Stat({ label, value }) {
    return (
        <div className="stat">
            <div className="stat-value">{value}</div>
            <div className="muted">{label}</div>
        </div>
    )
}

function AvailabilityReport() {
    const { data, error, loading } = useApi(() => reportsApi.availability(), 'report-availability')
    if (error) return <ErrorMessage error={error} />
    if (loading && !data) return <p className="muted">Завантаження…</p>
    const { rows, summary } = data

    return (
        <>
            <div className="stats">
                <Stat label="Усього авто" value={summary.total_cars} />
                <Stat label="Вільні" value={summary.available} />
                <Stat label="В оренді" value={summary.rented} />
                <Stat label="В ремонті" value={summary.maintenance} />
            </div>
            <table className="table">
                <thead>
                <tr>
                    <th>Авто</th>
                    <th>Статус</th>
                    <th className="num">Оренд</th>
                    <th className="num">Днів в оренді</th>
                    <th className="num">Активних</th>
                </tr>
                </thead>
                <tbody>
                {rows.map((r) => (
                    <tr key={r.car_id}>
                        <td>{r.car}</td>
                        <td>
                            <StatusBadge status={r.status} />
                        </td>
                        <td className="num">{r.total_rentals}</td>
                        <td className="num">{r.days_rented}</td>
                        <td className="num">{r.active_rentals}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </>
    )
}

function FinancialReport() {
    const [from, setFrom] = useState('')
    const [to, setTo] = useState('')
    const { data, error, loading } = useApi(
        () => reportsApi.financial({ date_from: from, date_to: to }),
        `report-financial:${from}:${to}`,
    )

    return (
        <>
            <div className="card filters">
                <label>
                    Повернення з
                    <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                </label>
                <label>
                    Повернення по
                    <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                </label>
                {(from || to) && (
                    <button
                        className="btn btn-secondary"
                        onClick={() => {
                            setFrom('')
                            setTo('')
                        }}
                    >
                        Скинути
                    </button>
                )}
            </div>
            <ErrorMessage error={error} />
            {loading && !data && <p className="muted">Завантаження…</p>}
            {data && (
                <>
                    <div className="stats">
                        <Stat label="Закритих оренд" value={data.summary.closed_rentals} />
                        <Stat label="Дохід від оренди" value={formatMoney(data.summary.rental_income)} />
                        <Stat label="Дохід від штрафів" value={formatMoney(data.summary.fines_income)} />
                        <Stat label="Загальний дохід" value={formatMoney(data.summary.total_income)} />
                        <Stat label="Утримувані застави" value={formatMoney(data.summary.deposits_held)} />
                        <Stat label="Найприбутковіше авто" value={data.summary.top_car || '—'} />
                    </div>
                    <table className="table">
                        <thead>
                        <tr>
                            <th>Авто</th>
                            <th className="num">Закритих оренд</th>
                            <th className="num">Оренда</th>
                            <th className="num">Штрафи</th>
                            <th className="num">Разом</th>
                            <th className="num">Застави</th>
                        </tr>
                        </thead>
                        <tbody>
                        {data.rows.map((r) => (
                            <tr key={r.car_id}>
                                <td>{r.car}</td>
                                <td className="num">{r.closed_rentals}</td>
                                <td className="num">{formatMoney(r.rental_income)}</td>
                                <td className="num">{formatMoney(r.fines_income)}</td>
                                <td className="num">
                                    <strong>{formatMoney(r.total_income)}</strong>
                                </td>
                                <td className="num">{formatMoney(r.deposits_held)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </>
            )}
        </>
    )
}

export default function AdminReportsPage() {
    const [tab, setTab] = useState('availability')
    return (
        <>
            <h1>Звіти</h1>
            <div className="tabs">
                <button className={tab === 'availability' ? 'tab active' : 'tab'} onClick={() => setTab('availability')}>
                    Зайнятість авто
                </button>
                <button className={tab === 'financial' ? 'tab active' : 'tab'} onClick={() => setTab('financial')}>
                    Фінансові показники
                </button>
            </div>
            {tab === 'availability' ? <AvailabilityReport /> : <FinancialReport />}
        </>
    )
}