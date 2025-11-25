import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Building2, 
  Users, 
  Mail, 
  Phone, 
  MessageSquare, 
  HelpCircle,
  MessageCircle,
  Globe,
  UserPlus,
  Shield,
  Database,
  Zap,
  Settings as SettingsIcon,
  Bell,
  Languages,
  Palette,
  Calendar,
  MapPin,
  Target,
  Gamepad2,
  Package,
  Sliders,
  Workflow,
  FileText,
  Upload,
  Download,
  RotateCcw,
  Activity,
  BarChart3,
  PieChart,
  TrendingUp,
  Search,
  X
} from 'lucide-react'

const Settings = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')

  const handleItemClick = (itemName) => {
    if (itemName === 'Company') {
      navigate('/company/profile')
    } else if (itemName === 'Rebranding') {
      navigate('/company/branding')
    } else if (itemName === 'Departments') {
      navigate('/departments')
    } else if (itemName === 'Products') {
      navigate('/products')
    } else if (itemName === 'Agents') {
      navigate('/users/agents/new')
    }
    // Add more navigation cases as needed
  }

  const settingsCategories = [
    {
      title: 'ORGANIZATION',
      items: [
        { name: 'Company', icon: Building2, description: 'Company information and branding', hasRoute: true },
        { name: 'Rebranding', icon: Palette, description: 'Customize your brand appearance', hasRoute: true },
        { name: 'Business Hours', icon: Calendar, description: 'Set your operating hours' },
        { name: 'Holiday Lists', icon: Calendar, description: 'Manage holidays and closures' },
        { name: 'Departments', icon: MapPin, description: 'Organize your team structure' },
        { name: 'Customer Happiness', icon: Target, description: 'Customer satisfaction settings' },
        { name: 'Gamescope', icon: Gamepad2, description: 'Gamification features' },
        { name: 'Products', icon: Package, description: 'Product catalog management' }
      ]
    },
    {
      title: 'USER MANAGEMENT',
      items: [
        { name: 'Agents', icon: Users, description: 'Manage support agents' },
        { name: 'Zia Agents', icon: UserPlus, description: 'AI-powered agents' },
        { name: 'Teams', icon: Users, description: 'Team organization' },
        { name: 'Roles', icon: Shield, description: 'User roles and permissions' },
        { name: 'Profiles', icon: Users, description: 'User profile settings' },
        { name: 'Data Sharing', icon: Database, description: 'Data sharing preferences' }
      ]
    },
    {
      title: 'CHANNELS',
      items: [
        { name: 'Email', icon: Mail, description: 'Email channel configuration' },
        { name: 'Phone', icon: Phone, description: 'Phone support settings' },
        { name: 'Chat', icon: MessageSquare, description: 'Live chat configuration' },
        { name: 'Help Center', icon: HelpCircle, description: 'Knowledge base settings' },
        { name: 'Instant Messaging', icon: MessageCircle, description: 'IM integration' },
        { name: 'Social', icon: Globe, description: 'Social media channels' },
        { name: 'Web Forms', icon: FileText, description: 'Web form builder' },
        { name: 'Community', icon: Users, description: 'Community forums' }
      ]
    },
    {
      title: 'SELF SERVICE',
      items: [
        { name: 'Guided Conversations', icon: MessageSquare, description: 'Interactive help flows' },
        { name: 'ASAP', icon: Zap, description: 'Instant answer system' }
      ]
    },
    {
      title: 'CUSTOMIZATION',
      items: [
        { name: 'Buttons', icon: Sliders, description: 'Custom button configuration' },
        { name: 'Modules and Tabs', icon: Package, description: 'Interface customization' },
        { name: 'Layouts and Fields', icon: Sliders, description: 'Form and layout design' },
        { name: 'General Settings', icon: SettingsIcon, description: 'General preferences' },
        { name: 'Notifications', icon: Bell, description: 'Notification settings' },
        { name: 'Languages', icon: Languages, description: 'Multi-language support' }
      ]
    },
    {
      title: 'AUTOMATION',
      items: [
        { name: 'Assignment Rules', icon: Workflow, description: 'Automatic ticket assignment' },
        { name: 'Workflows', icon: Workflow, description: 'Process automation' },
        { name: 'Blueprint', icon: FileText, description: 'Process blueprints' },
        { name: 'Macros', icon: Zap, description: 'Quick action macros' },
        { name: 'Service Level Agreements', icon: Activity, description: 'SLA management' },
        { name: 'Supervisor Rules', icon: Shield, description: 'Escalation rules' }
      ]
    },
    {
      title: 'DATA ADMINISTRATION',
      items: [
        { name: 'Sandbox', icon: Package, description: 'Testing environment' },
        { name: 'Import', icon: Upload, description: 'Data import tools' },
        { name: 'Export', icon: Download, description: 'Data export tools' },
        { name: 'Data Backup', icon: Database, description: 'Backup management' },
        { name: 'Zwtch(Data Migration)', icon: RotateCcw, description: 'Migration tools' },
        { name: 'Bulk Action Log', icon: Activity, description: 'Bulk operation history' }
      ]
    },
    {
      title: 'INTEGRATIONS',
      items: [
        { name: 'Marketplace', icon: Package, description: 'Third-party integrations' },
        { name: 'Ticket Tracker', icon: Zap, description: 'Ticket Tracker suite integration' },
        { name: 'Microsoft', icon: Package, description: 'Microsoft integrations' },
        { name: 'Others', icon: Globe, description: 'Other integrations' }
      ]
    }
  ]

  const productUpdates = [
    {
      title: 'Export Records from Views',
      description: 'Views comprise records categorized based on provider-defined criteria. You can now export records directly from views for seamless data management.',
      link: 'Read More',
      icon: Download
    },
    {
      title: 'Zia Powered by Open Source Language Module',
      description: 'Leverage Zia\'s Generative AI capabilities by getting ticket insights, summarizing lengthy conversations, and replying more efficiently with enhanced productivity. You can also deploy Zia to interact with your customers across channels.',
      link: 'Watch Video',
      icon: Zap
    },
    {
      title: 'Streamline business processes with blueprint',
      description: 'Watch the webinar and read our Ebook to master the blueprint strategy. Get started now!',
      link: 'Read Ebook',
      icon: FileText
    },
    {
      title: 'RegEx in layout and validation rules',
      description: 'Enables you to collect structured information like email addresses, URLs, credit card numbers, etc. in a pre-defined format to ensure data accuracy and validity.',
      link: 'Read More',
      icon: Shield
    }
  ]

  const filteredCategories = settingsCategories.map(category => ({
    ...category,
    items: category.items.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.items.length > 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-900">Setup</h1>
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <SettingsIcon className="h-5 w-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search setup and configuration..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-96"
            />
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Main Settings Content */}
        <div className="flex-1 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
            {filteredCategories.map((category, categoryIndex) => (
              <div key={categoryIndex} className="space-y-4">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {category.title}
                </h2>
                <div className="space-y-2">
                  {category.items.map((item, itemIndex) => (
                    <button
                      key={itemIndex}
                      onClick={() => handleItemClick(item.name)}
                      className="w-full text-left p-3 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-sm transition-all duration-200 group"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-primary-50 transition-colors">
                          <item.icon className="h-5 w-5 text-gray-600 group-hover:text-primary-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 group-hover:text-primary-700">
                            {item.name}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Product Updates Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <TrendingUp className="h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Product Updates</h2>
          </div>
          
          <div className="space-y-6">
            {productUpdates.map((update, index) => (
              <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0">
                <div className="flex items-start space-x-3 mb-3">
                  <div className="p-2 bg-primary-50 rounded-lg">
                    <update.icon className="h-4 w-4 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">
                      {update.title}
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed mb-3">
                      {update.description}
                    </p>
                    <button className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                      {update.link}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings