import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import VerifyPage from './pages/auth/VerifyPage'
import FoodMenuPage from './pages/FoodMenuPage'
import RestaurantPage from './pages/RestaurantPage'
import CheckoutPage from './pages/CheckoutPage'
import OrdersPage from './pages/OrdersPage'
import OrderTrackingPage from './pages/OrderTrackingPage'
import ProfilePage from './pages/profile/ProfilePage'
import HealthProfilePage from './pages/profile/HealthProfilePage'
import DietitiansPage from './pages/DietitiansPage'
import ConsultationPage from './pages/ConsultationPage'
import DashboardPage from './pages/DashboardPage'
import NotFoundPage from './pages/NotFoundPage'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Layout>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify" element={<VerifyPage />} />
            <Route path="/menu" element={<FoodMenuPage />} />
            <Route path="/restaurant/:id" element={<RestaurantPage />} />
            <Route path="/dietitians" element={<DietitiansPage />} />
            
            {/* Protected routes */}
            <Route path="/checkout" element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            } />
            <Route path="/orders" element={
              <ProtectedRoute>
                <OrdersPage />
              </ProtectedRoute>
            } />
            <Route path="/orders/:id/track" element={
              <ProtectedRoute>
                <OrderTrackingPage />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/health-profile" element={
              <ProtectedRoute>
                <HealthProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/consultation/:id" element={
              <ProtectedRoute>
                <ConsultationPage />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />
            
            {/* 404 page */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Layout>
      </CartProvider>
    </AuthProvider>
  )
}

export default App