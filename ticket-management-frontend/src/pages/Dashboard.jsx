import React, { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { 
  Ticket, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Users, 
  TrendingUp,
  Plus,
  ArrowRight,
  Calendar,
  Filter,
  BarChart3,
  PieChart,
  Activity,
  Timer,
  UserCheck,
  Pause
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import WelcomeModal from '../components/WelcomeModal'
import api from '../services/api'

const Dashboard = () => {
  const { user } = useAuth()
  const { companyId } = useParams()
  const [stats, setStats] = useState({
    openTickets: 0,
    onHoldTickets: 0,
    overdueTickets: 0,
    dueToday: 0,
    unassignedDueInHour: 0,
    unassignedTickets: 0,
    newTickets: 0,
    closedTickets: 0,
    backlogTickets: 0
  })
  const [timeFilter, setTimeFilter] = useState('Last 24 Hours')
  const [loading, setLoading] = useState(true)
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)
  const [hasCompany, setHasCompany] = useState(true)

  useEffect(() => {
    checkCompanySetup()
    fetchDashboardData()
  }, [])

  const checkCompanySetup = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"))
      const response = await api.get('/companies/by-user/'+user._id)
      // If no company data or company name is empty, show welcome modal
      if (!response.data || !response.data.companyName) {
        setShowWelcomeModal(true)
        setHasCompany(false)
      }
    } catch (error) {
      // If error (like 404), assume no company setup
      if (error.response?.status === 404) {
        setShowWelcomeModal(true)
        setHasCompany(false)
      }
    }
  }

  const handleWelcomeModalClose = (setupComplete) => {
    setShowWelcomeModal(false)
    if (setupComplete) {
      setHasCompany(true)
      // Optionally refresh dashboard data
      fetchDashboardData()
    }
  }

  const fetchDashboardData = async () => {
    try {
      const response = await api.get(`/${companyId}/tickets`)
      const tickets = response.data.tickets || []
      
      // Calculate comprehensive stats
      const now = new Date()
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)
      
      const openTickets = tickets.filter(t => t.status === 'open').length
      const onHoldTickets = tickets.filter(t => t.status === 'pending').length
      const overdueTickets = tickets.filter(t => 
        t.dueDate && new Date(t.dueDate) < now && !['resolved', 'closed'].includes(t.status)
      ).length
      const dueToday = tickets.filter(t => 
        t.dueDate && new Date(t.dueDate) >= today && new Date(t.dueDate) < new Date(today.getTime() + 24 * 60 * 60 * 1000)
      ).length
      const unassignedDueInHour = tickets.filter(t => 
        !t.assignedTo && !t.assignedAgentId && t.dueDate && new Date(t.dueDate) <= oneHourFromNow
      ).length
      const unassignedTickets = tickets.filter(t => !t.assignedTo && !t.assignedAgentId).length
      const newTickets = tickets.filter(t => new Date(t.createdAt) >= yesterday).length
      const closedTickets = tickets.filter(t => t.status === 'closed').length
      const backlogTickets = tickets.filter(t => t.status === 'in-progress').length
      
      setStats({
        openTickets,
        onHoldTickets,
        overdueTickets,
        dueToday,
        unassignedDueInHour,
        unassignedTickets,
        newTickets,
        closedTickets,
        backlogTickets
      })
      
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Main dashboard metrics (top row)
  const mainMetrics = [
    {
      title: 'Open Tickets',
      value: stats.openTickets,
      icon: Ticket,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200'
    },
    {
      title: 'On Hold Tickets',
      value: stats.onHoldTickets,
      icon: Pause,
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-700',
      borderColor: 'border-gray-200'
    },
    {
      title: 'Overdue Tickets',
      value: stats.overdueTickets,
      icon: AlertTriangle,
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      borderColor: 'border-red-200'
    },
    {
      title: 'Due Today',
      value: stats.dueToday,
      icon: Calendar,
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
      borderColor: 'border-orange-200'
    },
    {
      title: 'Unassigned Due in 1 Hour',
      value: stats.unassignedDueInHour,
      icon: Timer,
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
      borderColor: 'border-yellow-200'
    },
    {
      title: 'Unassigned Tickets',
      value: stats.unassignedTickets,
      icon: UserCheck,
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      borderColor: 'border-purple-200'
    }
  ]

  // Ticket stats for the chart section
  const ticketStats = [
    {
      title: 'New Tickets',
      value: stats.newTickets,
      subtitle: '(Total)',
      color: 'text-blue-600'
    },
    {
      title: 'On Hold Ticket',
      value: stats.onHoldTickets,
      subtitle: '(Total)',
      color: 'text-gray-600'
    },
    {
      title: 'Closed Ticket',
      value: stats.closedTickets,
      subtitle: '(Total)',
      color: 'text-green-600'
    },
    {
      title: 'Backlog Tickets',
      value: stats.backlogTickets,
      subtitle: '(Average)',
      color: 'text-orange-600'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <>
      <WelcomeModal 
        isOpen={showWelcomeModal} 
        onClose={handleWelcomeModalClose}
        userName={user?.name || 'User'}
      />
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Overview Dashboard</h1>
          <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <Filter className="h-5 w-5" />
          </button>
        </div>
        <div className="flex items-center space-x-3">
          <select 
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="input-field text-sm"
          >
            <option>Last 24 Hours</option>
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>Last 90 Days</option>
          </select>
        </div>
      </div>
      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {mainMetrics.map((metric, index) => (
          <div key={index} className={`card border ${metric.borderColor} dark:border-gray-700 p-4 hover:shadow-md transition-shadow`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{metric.title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{metric.value}</p>
              </div>
              <div className={`p-2 rounded-lg ${metric.bgColor} dark:bg-opacity-20`}>
                <metric.icon className={`h-5 w-5 ${metric.textColor} dark:opacity-80`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tickets Stats Section */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Tickets Stats</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {ticketStats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="mb-2">
                <span className={`text-3xl font-bold ${stat.color}`}>{stat.value}</span>
                <span className="text-sm text-gray-500 ml-1">{stat.subtitle}</span>
              </div>
              <p className="text-sm font-medium text-gray-700">{stat.title}</p>
            </div>
          ))}
        </div>

        {/* Chart Placeholder */}
        <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">Ticket Volume Chart</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">Chart visualization would appear here</p>
          </div>
        </div>
      </div>

      {/* Bottom Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Traffic Analysis */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Traffic Analysis</h3>
            <select className="input-field text-sm px-2 py-1">
              <option>Donut</option>
              <option>Bar</option>
              <option>Line</option>
            </select>
          </div>
          <div className="h-32 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
            <PieChart className="h-8 w-8 text-gray-400 dark:text-gray-500" />
          </div>
        </div>

        {/* Average Handling Time */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Average Handling Time</h3>
            <select className="input-field text-sm px-2 py-1">
              <option>Horizontal Bar</option>
              <option>Vertical Bar</option>
            </select>
          </div>
          <div className="h-32 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
            <Activity className="h-8 w-8 text-gray-400 dark:text-gray-500" />
          </div>
        </div>

        {/* Happiness Rate */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Happiness Rate</h3>
            <select className="input-field text-sm px-2 py-1">
              <option>Donut</option>
              <option>Gauge</option>
            </select>
          </div>
          <div className="h-32 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
            <TrendingUp className="h-8 w-8 text-gray-400 dark:text-gray-500" />
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

export default Dashboard