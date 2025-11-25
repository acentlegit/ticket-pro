# Ticket Management Frontend

A modern React-based frontend for the Enterprise Ticket Management System.

## Features

- **Modern UI/UX**: Clean, responsive design built with React and Tailwind CSS
- **Authentication**: Secure login with JWT tokens
- **Dashboard**: Overview of ticket statistics and recent activity
- **Ticket Management**: Create, view, edit, and filter tickets
- **User Management**: Admin interface for managing users and roles
- **Role-based Access**: Different permissions for admin, supervisor, agent, and customer roles
- **Real-time Updates**: Responsive interface with loading states and error handling

## Tech Stack

- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **Lucide React** - Beautiful icons

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Backend API running on http://localhost:4000

### Installation

1. **Install dependencies:**
   ```bash
   cd ticket-management-frontend
   npm install
   ```

2. **Environment setup:**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` if your backend runs on a different port:
   ```
   VITE_API_URL=http://localhost:4000
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to http://localhost:3000

## Default Login Credentials

The system comes with pre-seeded demo accounts:

- **Admin**: admin@enterprise.com / admin123
- **Supervisor**: supervisor@enterprise.com / supervisor123  
- **Agent**: agent@enterprise.com / agent123
- **Customer**: customer@enterprise.com / customer123

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.jsx      # Main layout wrapper
│   ├── Header.jsx      # Top navigation bar
│   ├── Sidebar.jsx     # Side navigation menu
│   └── ProtectedRoute.jsx # Route protection
├── contexts/           # React contexts
│   └── AuthContext.jsx # Authentication state management
├── pages/              # Page components
│   ├── Login.jsx       # Login page
│   ├── Dashboard.jsx   # Main dashboard
│   ├── TicketList.jsx  # Ticket listing page
│   ├── TicketDetail.jsx # Individual ticket view
│   ├── CreateTicket.jsx # New ticket form
│   └── UserManagement.jsx # User admin page
├── services/           # API services
│   └── api.js          # Axios configuration
├── App.jsx             # Main app component
├── main.jsx            # App entry point
└── index.css           # Global styles
```

## Features by Role

### Customer
- Create new tickets
- View own tickets
- Update ticket details

### Agent
- View all tickets
- Update ticket status and priority
- Assign tickets to themselves

### Supervisor
- All agent permissions
- Assign tickets to other agents
- Manage users (create, edit)

### Admin
- All supervisor permissions
- Full user management
- System configuration

## API Integration

The frontend communicates with the backend API through:

- **Authentication**: JWT token-based auth
- **Tickets**: CRUD operations for ticket management
- **Users**: User management for admins/supervisors
- **Real-time**: Automatic token refresh and error handling

## Responsive Design

The interface is fully responsive and works on:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## Development

### Adding New Pages

1. Create component in `src/pages/`
2. Add route in `App.jsx`
3. Update navigation in `Sidebar.jsx`

### Styling Guidelines

- Use Tailwind CSS utility classes
- Follow existing component patterns
- Maintain consistent spacing and colors
- Use the predefined CSS classes in `index.css`

### State Management

- Authentication state: `AuthContext`
- Component state: React hooks (`useState`, `useEffect`)
- API calls: Axios with interceptors

## Production Build

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Ensure backend is running on port 4000
   - Check VITE_API_URL in .env file

2. **Login Issues**
   - Verify backend authentication endpoints
   - Check browser console for errors

3. **Build Errors**
   - Clear node_modules and reinstall
   - Check for TypeScript/ESLint errors

### Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+