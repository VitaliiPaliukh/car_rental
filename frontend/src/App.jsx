import { Link, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import CarPage from './pages/CarPage'
import CatalogPage from './pages/CatalogPage'
import LoginPage from './pages/LoginPage'
import MyRentalsPage from './pages/MyRentalsPage'
import RegisterPage from './pages/RegisterPage'
import AdminCarsPage from './pages/admin/AdminCarsPage'
import AdminClientsPage from './pages/admin/AdminClientsPage'
import AdminRentalsPage from './pages/admin/AdminRentalsPage'
import AdminReportsPage from './pages/admin/AdminReportsPage'

const admin = (page) => <ProtectedRoute role="admin">{page}</ProtectedRoute>

export default function App() {
    return (
        <Routes>
            <Route element={<Layout />}>
                <Route path="/" element={<CatalogPage />} />
                <Route path="/cars/:id" element={<CarPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route
                    path="/my-rentals"
                    element={
                        <ProtectedRoute role="client">
                            <MyRentalsPage />
                        </ProtectedRoute>
                    }
                />
                <Route path="/admin" element={<Navigate to="/admin/rentals" replace />} />
                <Route path="/admin/cars" element={admin(<AdminCarsPage />)} />
                <Route path="/admin/clients" element={admin(<AdminClientsPage />)} />
                <Route path="/admin/rentals" element={admin(<AdminRentalsPage />)} />
                <Route path="/admin/reports" element={admin(<AdminReportsPage />)} />
                <Route
                    path="*"
                    element={
                        <p>
                            Сторінку не знайдено. <Link to="/">На головну</Link>
                        </p>
                    }
                />
            </Route>
        </Routes>
    )
}