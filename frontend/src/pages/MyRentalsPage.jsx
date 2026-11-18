import { useState } from 'react'
import * as carsApi from '../api/cars'
import * as rentalsApi from '../api/rentals'
import ErrorMessage from '../components/ErrorMessage'
import StatusBadge from '../components/StatusBadge'
import useApi from '../hooks/useApi'
import { formatDate, formatMoney } from '../utils'

export default function MyRentalsPage() {
    const [actionError, setActionError] = useState(null)

    const { data, error, loading, reload } = useApi(
        async () => {
            const [rentals, cars] = await Promise.all([rentalsApi.mine(), carsApi.list()])
            return { rentals, cars: Object.fromEntries(cars.map((c) => [c.id, c])) }
        },
        'my-rentals',
    )

    const cancel = async (id) => {
        if (!window.confirm('Скасувати це бронювання?')) return
        setActionError(null)
        try {
            await rentalsApi.cancel(id)
            reload()
        } catch (e) {
            setActionError(e)
        }
    }

    return (
        <>
            <h1>Мої оренди</h1>
            <ErrorMessage error={error} />
            <ErrorMessage error={actionError} />
            {loading && !data && <p className="muted">Завантаження…</p>}
            {data && data.rentals.length === 0 && <p className="muted">У вас ще немає оренд. Оберіть авто в каталозі.</p>}
            {data && data.rentals.length > 0 && (
                <table className="table">
                    <thead>
                    <tr>
                        <th>№</th>
                        <th>Авто</th>
                        <th>Період</th>
                        <th className="num">Вартість</th>
                        <th className="num">Застава</th>
                        <th>Статус</th>
                        <th>Штрафи</th>
                        <th />
                    </tr>
                    </thead>
                    <tbody>
                    {data.rentals.map((r) => {
                        const car = data.cars[r.car_id]
                        return (
                            <tr key={r.id}>
                                <td>{r.id}</td>
                                <td>{car ? `${car.brand} ${car.model}` : `#${r.car_id}`}</td>
                                <td>
                                    {formatDate(r.issue_date)} — {formatDate(r.actual_return_date || r.expected_return_date)}
                                </td>
                                <td className="num">{formatMoney(r.total_cost)}</td>
                                <td className="num">{formatMoney(r.deposit_amount)}</td>
                                <td>
                                    <StatusBadge status={r.status} />
                                </td>
                                <td>
                                    {r.fines.length === 0
                                        ? '—'
                                        : r.fines.map((f) => (
                                            <div key={f.id}>
                                                {f.reason}: {formatMoney(f.amount)}
                                            </div>
                                        ))}
                                </td>
                                <td>
                                    {r.status === 'reserved' && (
                                        <button className="btn btn-secondary btn-sm" onClick={() => cancel(r.id)}>
                                            Скасувати
                                        </button>
                                    )}
                                </td>
                            </tr>
                        )
                    })}
                    </tbody>
                </table>
            )}
        </>
    )
}