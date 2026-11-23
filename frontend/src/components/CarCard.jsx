import { Link } from 'react-router-dom'
import { CAR_TYPES, formatMoney } from '../utils'
import CarPhoto from './CarPhoto'
import StatusBadge from './StatusBadge'

export default function CarCard({ car, search = '' }) {
    return (
        <div className="card car-card">
            <CarPhoto car={car} />
            <div className="car-card-top">
                <span className="car-type">{CAR_TYPES[car.type] || car.type}</span>
                <StatusBadge status={car.status} />
            </div>
            <h3>
                {car.brand} {car.model}
            </h3>
            <p className="muted">{car.year} рік випуску</p>
            <p className="price">
                {formatMoney(car.price_per_day)} <small>/ доба</small>
            </p>
            <p className="muted">Застава: {formatMoney(car.deposit)}</p>
            <Link className="btn" to={`/cars/${car.id}${search}`}>
                Детальніше
            </Link>
        </div>
    )
}