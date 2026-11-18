import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import useAuth from '../context/useAuth'

export default function Layout() {
    const { user, isAdmin, isClient, logout } = useAuth()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/')
    }

    return (
        <>
            <header className="header">
                <div className="container header-inner">
                    <NavLink to="/" className="brand">
                        🚗 Прокат авто
                    </NavLink>
                    <nav className="nav">
                        <NavLink to="/" end>
                            Каталог
                        </NavLink>
                        {isClient && <NavLink to="/my-rentals">Мої оренди</NavLink>}
                        {isAdmin && (
                            <>
                                <NavLink to="/admin/cars">Автопарк</NavLink>
                                <NavLink to="/admin/clients">Клієнти</NavLink>
                                <NavLink to="/admin/rentals">Оренди</NavLink>
                                <NavLink to="/admin/reports">Звіти</NavLink>
                            </>
                        )}
                    </nav>
                    <div className="nav-user">
                        {user ? (
                            <>
                <span className="muted">
                  {user.email} ({isAdmin ? 'адмін' : 'клієнт'})
                </span>
                                <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
                                    Вийти
                                </button>
                            </>
                        ) : (
                            <>
                                <NavLink to="/login">Вхід</NavLink>
                                <NavLink to="/register" className="btn btn-sm">
                                    Реєстрація
                                </NavLink>
                            </>
                        )}
                    </div>
                </div>
            </header>
            <main className="container main">
                <Outlet />
            </main>
        </>
    )
}