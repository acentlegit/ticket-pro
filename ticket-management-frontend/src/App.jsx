import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import TicketList from './pages/TicketList'
import TicketDetail from './pages/TicketDetail'
import CreateTicket from './pages/CreateTicket'
import EditTicket from './pages/EditTicket'
import Customers from './pages/Customers'
import UserManagement from './pages/UserManagement'
import AddAgent from './pages/AddAgent'
import CompanyBranding from './pages/CompanyBranding'
import CompanyProfile from './pages/CompanyProfile'
import Departments from './pages/Departments'
import Products from './pages/Products'
import AddProduct from './pages/AddProduct'
import Settings from './pages/Settings'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="tickets" element={<TicketList />} />
            <Route path="tickets/new" element={<CreateTicket />} />
            <Route path="tickets/:id/edit" element={<EditTicket />} />
            <Route path="tickets/:id" element={<TicketDetail />} />
            <Route path="customers" element={<Customers />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="users/agents/new" element={<AddAgent />} />
            <Route path="company/branding" element={<CompanyBranding />} />
            <Route path="company/profile" element={<CompanyProfile />} />
            <Route path="departments" element={<Departments />} />
            <Route path="products" element={<Products />} />
            <Route path="products/new" element={<AddProduct />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App