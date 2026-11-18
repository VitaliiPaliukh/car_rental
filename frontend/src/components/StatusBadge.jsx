import { CAR_STATUSES, RENTAL_STATUSES } from '../utils'

const LABELS = { ...CAR_STATUSES, ...RENTAL_STATUSES }

export default function StatusBadge({ status }) {
    return <span className={`badge badge-${status}`}>{LABELS[status] || status}</span>
}