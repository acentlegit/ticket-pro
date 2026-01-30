import React from 'react'
import { NavLink } from 'react-router-dom'
import { X, Home, Ticket, Plus, Users, BarChart3, Settings, Building2, Headphones } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useParams } from 'react-router-dom'
import { PERMISSIONS } from '../config/permissions'

const Sidebar = ({ open, setOpen }) => {
  const { user, checkPermission } = useAuth()
  const { companyId } = useParams()

  const navigation = companyId ? [
    { name: 'Dashboard', href: `/companies/${companyId}/dashboard`, icon: Home },
    { name: 'All Tickets', href: `/companies/${companyId}/tickets`, icon: Ticket },
    // Only show Create Ticket if user has permission
    ...(checkPermission(PERMISSIONS.TCKT_CREATE)
      ? [{ name: 'Create Ticket', href: `/companies/${companyId}/tickets/new`, icon: Plus }]
      : []),
    { name: 'Customers', href: `/companies/${companyId}/customers`, icon: Building2 },
    // User Management based on permission (usually admin/supervisor/dept_admin)
    ...(checkPermission(PERMISSIONS.TCKT_ASSIGN) || user?.role === 'admin' || user?.role === 'company_admin'
      ? [{ name: 'User Management', href: `/companies/${companyId}/users`, icon: Users }]
      : []),
    // Analytics based on permission
    ...(checkPermission(PERMISSIONS.ANALYTICS_VIEW)
      ? [{ name: 'Analytics', href: `/companies/${companyId}/analytics`, icon: BarChart3 }]
      : []),
    { name: 'Settings', href: `/companies/${companyId}/settings`, icon: Settings },
    { name: 'Customer Care', href: `/companies/${companyId}/customer-care`, icon: Headphones },
  ] : [
    // Global User Management for Super Admin
    ...(user?.role === 'admin'
      ? [
        { name: 'Companies', href: '/companies', icon: Building2 },
        { name: 'All Users', href: '/users', icon: Users }
      ]
      : []),
  ]

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 lg:hidden z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Ticket className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">TicketPro</span>
          </div>

          <button
            onClick={() => setOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${isActive
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 border-r-2 border-primary-700 dark:border-primary-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                  }`
                }
                onClick={() => setOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        {/* User info at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
              <span className="text-white font-medium">
                {user?.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {user?.role}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar