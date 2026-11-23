import { useEffect, useMemo, useState } from 'react'
import * as carsApi from '../../api/cars'
import { assetUrl } from '../../api/client'
import CarPhoto from '../../components/CarPhoto'
import ErrorMessage from '../../components/ErrorMessage'
import StatusBadge from '../../components/StatusBadge'
import useApi from '../../hooks/useApi'
import { CAR_STATUSES, CAR_TYPES, formatMoney } from '../../utils'

const MAX_PHOTO_BYTES = 5 * 1024 * 1024
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const EMPTY = {
    brand: '',
    model: '',
    type: 'economy',
    year: new Date().getFullYear(),
    price_per_day: '',
    deposit: '',
    status: 'available',
    photo_url: null,
}

function CarForm({ initial, onSaved, onCancel }) {
    const [carId, setCarId] = useState(initial.id || null)
    const editing = Boolean(carId)
    const [form, setForm] = useState(initial)
    const [file, setFile] = useState(null) // новий файл, обраний у формі
    const [removePhoto, setRemovePhoto] = useState(false)
    const [error, setError] = useState(null)
    const [busy, setBusy] = useState(false)
    const set = (name) => (e) => setForm({ ...form, [name]: e.target.value })

    // прев'ю обраного файлу (адреса звільняється, коли файл змінюється)
    const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])
    useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview])
    const currentPhoto = removePhoto ? null : assetUrl(initial.photo_url)

    const pickFile = (e) => {
        const picked = e.target.files[0]
        if (!picked) return setFile(null)
        if (!PHOTO_TYPES.includes(picked.type)) {
            e.target.value = ''
            return setError(new Error('Дозволені формати фото: JPEG, PNG, WebP'))
        }
        if (picked.size > MAX_PHOTO_BYTES) {
            e.target.value = ''
            return setError(new Error('Фото завелике: максимум 5 МБ'))
        }
        setError(null)
        setFile(picked)
    }

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
        if (form.deposit !== '' && form.deposit !== null) payload.deposit = Number(form.deposit)

        let id = carId
        try {
            if (id) {
                await carsApi.update(id, { ...payload, status: form.status })
            } else {
                id = (await carsApi.create(payload)).id
                setCarId(id) // якщо фото не завантажиться, повторне збереження не створить дублікат
            }
        } catch (err) {
            setError(err)
            setBusy(false)
            return
        }

        try {
            if (file) await carsApi.uploadPhoto(id, file)
            else if (removePhoto && initial.photo_url) await carsApi.removePhoto(id)
        } catch (err) {
            setError(new Error(`Авто збережено, але фото не оброблено: ${err.message}`))
            setBusy(false)
            return
        }
        onSaved()
    }

    return (
        <form className="card form" onSubmit={submit}>
            <h2>{editing ? `Редагування авто №${carId}` : 'Нове авто'}</h2>
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

            <div className="photo-field">
                {preview || currentPhoto ? (
                    <img className="car-photo thumb-large" src={preview || currentPhoto} alt="Фото авто" />
                ) : (
                    <div className="car-photo car-photo-empty thumb-large">🚗</div>
                )}
                <div>
                    <label>
                        Фото авто (JPEG, PNG, WebP, до 5 МБ)
                        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={pickFile} />
                    </label>
                    <div className="actions">
                        {currentPhoto && !file && (
                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setRemovePhoto(true)}>
                                Видалити поточне фото
                            </button>
                        )}
                        {removePhoto && !file && (
                            <>
                                <span className="muted">Фото буде видалено після збереження</span>
                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setRemovePhoto(false)}>
                                    Скасувати
                                </button>
                            </>
                        )}
                    </div>
                </div>
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
                        <th>Фото</th>
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
                                <CarPhoto car={c} className="thumb" />
                            </td>
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