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
import Companies from './pages/Companies'
import CreateCompany from './pages/CreateCompany'
import Customers from './pages/Customers'
import UserManagement from './pages/UserManagement'
import AddAgent from './pages/AddAgent'
import CompanyProfile from './pages/CompanyProfile'
import CompanyBranding from './pages/CompanyBranding'
import Departments from './pages/Departments'
import Products from './pages/Products'
import AddProduct from './pages/AddProduct'
import Settings from './pages/Settings'
import InvitationAccept from './pages/InvitationAccept'
import InvitationRegister from './pages/InvitationRegister'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
      <AuthProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/invitation/accept/:token" element={<InvitationAccept />} />
          <Route path="/invitation/accept" element={<InvitationAccept />} />
          <Route path="/invitation/register/:token" element={<InvitationRegister />} />
          <Route path="/invitation/register" element={<InvitationRegister />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/companies" replace />} />
            <Route path="dashboard" element={<Navigate to="/companies" replace />} />




            <Route path="companies" element={<Companies />} />
            <Route path="companies/new" element={<CreateCompany />} />
            <Route path="companies/:companyId/dashboard" element={<Dashboard />} />
            <Route path="companies/:companyId/tickets" element={<TicketList />} />
            <Route path="companies/:companyId/tickets/new" element={<CreateTicket />} />
            <Route path="companies/:companyId/tickets/:id" element={<TicketDetail />} />
            <Route path="companies/:companyId/tickets/:id/edit" element={<EditTicket />} />
            <Route path="companies/:companyId/customers" element={<Customers />} />
            <Route path="companies/:companyId/users" element={<UserManagement />} />
            <Route path="companies/:companyId/settings" element={<Settings />} />
            <Route path="companies/:companyId/profile" element={<CompanyProfile />} />
            <Route path="companies/:companyId/users/agents/new" element={<AddAgent />} />
            <Route path="companies/:companyId/departments" element={<Departments />} />
            <Route path="companies/:companyId/products" element={<Products />} />
            <Route path="companies/:companyId/products/new" element={<AddProduct />} />
            <Route path="companies/:companyId/branding" element={<CompanyBranding />} />









          </Route>
        </Routes>
        </Router>
      </AuthProvider>
  )
}

export default App