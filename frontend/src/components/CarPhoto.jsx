import { assetUrl } from '../api/client'

export default function CarPhoto({ car, className = '' }) {
    const src = assetUrl(car.photo_url)
    if (!src) {
        return (
            <div className={`car-photo car-photo-empty ${className}`} role="img" aria-label="Фото відсутнє">
                🚗
            </div>
        )
    }
    return <img className={`car-photo ${className}`} src={src} alt={`${car.brand} ${car.model}`} loading="lazy" />
}