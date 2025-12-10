import React from 'react'
import { Menu, Bell, Search, User, LogOut, Building2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useParams, useNavigate } from 'react-router-dom'

const Header = ({ setSidebarOpen }) => {
  const { user, logout } = useAuth()
  const { companyId } = useParams()
  const navigate = useNavigate()

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search tickets..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-64"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Company Info & Switch Company */}
          {companyId && (
            <div className="hidden lg:flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-sm text-gray-700">
                <Building2 className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{JSON.parse(localStorage.getItem('company') || '{}').companyName || 'Company'}</span>
              </div>
              <button
                onClick={() => navigate('/companies')}
                className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                title="Switch Company"
              >
                <span className="text-sm font-medium">Switch Company</span>
              </button>
            </div>
          )}

          {/* Notifications */}
          <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg relative">
            <Bell className="h-5 w-5 md:h-6 md:w-6" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User menu */}
          <div className="relative group">
            <button className="flex items-center space-x-2 md:space-x-3 p-2 rounded-lg hover:bg-gray-100">
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div className="text-left hidden md:block">
                <div className="text-sm font-medium text-gray-900">{user?.name}</div>
                <div className="text-xs text-gray-500 capitalize">{user?.role}</div>
              </div>
            </button>
            
            {/* Dropdown menu */}
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="py-2">
                <button
                  onClick={logout}
                  className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header