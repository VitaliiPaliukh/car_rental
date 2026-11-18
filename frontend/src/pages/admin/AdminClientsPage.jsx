import { useState } from 'react'
import * as clientsApi from '../../api/clients'
import ErrorMessage from '../../components/ErrorMessage'
import useApi from '../../hooks/useApi'

const EMPTY = { full_name: '', address: '', phone: '' }

function ClientForm({ initial, onSaved, onCancel }) {
    const editing = Boolean(initial.id)
    const [form, setForm] = useState(initial)
    const [error, setError] = useState(null)
    const [busy, setBusy] = useState(false)
    const set = (name) => (e) => setForm({ ...form, [name]: e.target.value })

    const submit = async (e) => {
        e.preventDefault()
        setBusy(true)
        setError(null)
        const payload = { full_name: form.full_name, address: form.address, phone: form.phone }
        try {
            if (editing) await clientsApi.update(initial.id, payload)
            else await clientsApi.create(payload)
            onSaved()
        } catch (err) {
            setError(err)
            setBusy(false)
        }
    }

    return (
        <form className="card form" onSubmit={submit}>
            <h2>{editing ? `Редагування клієнта №${initial.id}` : 'Новий клієнт'}</h2>
            <div className="form-row">
                <label>
                    ПІБ
                    <input required value={form.full_name} onChange={set('full_name')} />
                </label>
                <label>
                    Телефон
                    <input required value={form.phone} onChange={set('phone')} />
                </label>
                <label>
                    Адреса
                    <input required value={form.address} onChange={set('address')} />
                </label>
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

export default function AdminClientsPage() {
    const [search, setSearch] = useState('')
    const [editing, setEditing] = useState(null)
    const [actionError, setActionError] = useState(null)
    const { data: clients, error, loading, reload } = useApi(() => clientsApi.list(search), `admin-clients:${search}`)

    const remove = async (client) => {
        if (!window.confirm(`Видалити клієнта ${client.full_name}?`)) return
        setActionError(null)
        try {
            await clientsApi.remove(client.id)
            reload()
        } catch (e) {
            setActionError(e)
        }
    }

    return (
        <>
            <div className="page-head">
                <h1>Клієнти</h1>
                {!editing && (
                    <button className="btn" onClick={() => setEditing(EMPTY)}>
                        + Додати клієнта
                    </button>
                )}
            </div>

            {editing && (
                <ClientForm
                    key={editing.id || 'new'}
                    initial={editing}
                    onCancel={() => setEditing(null)}
                    onSaved={() => {
                        setEditing(null)
                        reload()
                    }}
                />
            )}

            <div className="card filters">
                <label>
                    Пошук за ПІБ або телефоном
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Іван, +38050…" />
                </label>
            </div>

            <ErrorMessage error={error} />
            <ErrorMessage error={actionError} />
            {loading && !clients && <p className="muted">Завантаження…</p>}
            {clients && clients.length === 0 && <p className="muted">Клієнтів не знайдено.</p>}
            {clients && clients.length > 0 && (
                <table className="table">
                    <thead>
                    <tr>
                        <th>№</th>
                        <th>ПІБ</th>
                        <th>Телефон</th>
                        <th>Адреса</th>
                        <th />
                    </tr>
                    </thead>
                    <tbody>
                    {clients.map((c) => (
                        <tr key={c.id}>
                            <td>{c.id}</td>
                            <td>{c.full_name}</td>
                            <td>{c.phone}</td>
                            <td>{c.address}</td>
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