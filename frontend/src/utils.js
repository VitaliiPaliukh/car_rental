export const CURRENCY = '$'

export function formatMoney(value) {
    if (value === null || value === undefined || value === '') return '—'
    return `${Number(value).toFixed(2)} ${CURRENCY}`
}

export function formatDate(value) {
    if (!value) return '—'
    const [y, m, d] = String(value).split('-')
    return `${d}.${m}.${y}`
}

// Сьогоднішня дата у форматі YYYY-MM-DD (за локальним часом)
export function todayISO(offsetDays = 0) {
    const d = new Date()
    d.setDate(d.getDate() + offsetDays)
    return d.toLocaleDateString('sv-SE')
}

export const CAR_TYPES = { economy: 'Економ', suv: 'Позашляховик', premium: 'Преміум' }
export const CAR_STATUSES = { available: 'Вільне', rented: 'В оренді', maintenance: 'В ремонті' }
export const RENTAL_STATUSES = {
    reserved: 'Заброньовано',
    active: 'Активна',
    overdue: 'Прострочена',
    closed: 'Закрита',
    cancelled: 'Скасована',
}
export const DAMAGE_LEVELS = { none: 'Немає', minor: 'Незначні', major: 'Серйозні' }
export const OPTION_LABELS = {
    insurance: 'Страхування',
    gps: 'GPS-навігатор',
    child_seat: 'Дитяче крісло',
}