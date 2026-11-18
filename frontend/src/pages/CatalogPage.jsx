import { useState } from 'react'
import * as carsApi from '../api/cars'
import CarCard from '../components/CarCard'
import ErrorMessage from '../components/ErrorMessage'
import useApi from '../hooks/useApi'
import { CAR_TYPES } from '../utils'

export default function CatalogPage() {
    const [type, setType] = useState('')
    const [start, setStart] = useState('')
    const [end, setEnd] = useState('')

    const byDates = Boolean(start && end && end > start)

    const { data: cars, error, loading } = useApi(async () => {
        if (byDates) {
            const free = await carsApi.available(start, end)
            return type ? free.filter((c) => c.type === type) : free
        }
        return carsApi.list({ type })
    }, `catalog:${type}:${byDates ? start + end : ''}`)

    const search = byDates ? `?start=${start}&end=${end}` : ''

    return (
        <>
            <h1>Каталог автомобілів</h1>

            <div className="card filters">
                <label>
                    Тип авто
                    <select value={type} onChange={(e) => setType(e.target.value)}>
                        <option value="">Усі</option>
                        {Object.entries(CAR_TYPES).map(([value, label]) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    Вільне з
                    <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
                </label>
                <label>
                    Вільне до
                    <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
                </label>
                {(type || start || end) && (
                    <button
                        className="btn btn-secondary"
                        onClick={() => {
                            setType('')
                            setStart('')
                            setEnd('')
                        }}
                    >
                        Скинути
                    </button>
                )}
            </div>

            <ErrorMessage error={error} />
            {loading && !cars && <p className="muted">Завантаження…</p>}
            {cars && cars.length === 0 && <p className="muted">Автомобілів за цими умовами не знайдено.</p>}
            <div className="grid">
                {cars?.map((car) => (
                    <CarCard key={car.id} car={car} search={search} />
                ))}
            </div>
        </>
    )
}