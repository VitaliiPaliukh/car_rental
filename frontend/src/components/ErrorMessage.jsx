export default function ErrorMessage({ error }) {
    if (!error) return null
    return <div className="alert alert-error">{error.message || String(error)}</div>
}