import React, { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  
  // Pages that need full height without padding
  const fullHeightPages = ['/tickets', '/customers', '/settings']
  const isFullHeightPage = fullHeightPages.includes(location.pathname)

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header setSidebarOpen={setSidebarOpen} />
        
        <main className={`flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900 ${
          isFullHeightPage ? '' : 'p-6'
        }`}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout