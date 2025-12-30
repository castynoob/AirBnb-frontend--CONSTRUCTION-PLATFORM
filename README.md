# INTERVOS - Construction Management Platform

A comprehensive construction services marketplace that connects **property managers** with **contractors (entrepreneurs)** and **material suppliers**. Built with React + Vite for the frontend and Node.js + Express for the backend.

## Overview

INTERVOS streamlines the construction and property maintenance workflow by providing a platform where:

- **Property Managers** can post construction/repair jobs and receive competitive bids
- **Entrepreneurs (Contractors)** can browse jobs, submit bids, and complete work
- **Suppliers** can receive material requests and fulfill orders
- **Residents** can view announcements and communicate within their community

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, React Router |
| Styling | CSS Modules, Custom CSS |
| Icons | Lucide React |
| State | React Hooks, Context API |
| Real-time | Socket.io Client |
| Notifications | React Hot Toast |
| HTTP Client | Fetch API |

## User Roles & Features

### Property Manager
- Create and manage properties
- Post construction/repair jobs with budget ranges
- Review and accept/decline contractor bids
- Upload Excel inspection reports for bulk job creation
- Real-time messaging with contractors
- Manage favorite entrepreneurs
- Send urgent requests to multiple contractors

### Entrepreneur (Contractor)
- Browse available construction jobs
- Submit competitive bids on jobs
- Manage company profile (license, specializations, portfolio)
- Track submitted bids and their status
- Complete assigned work and receive reviews
- Subscribe to premium plans for unlimited bids
- Message property managers directly
- Request materials from suppliers

### Supplier
- Maintain company profile and product catalog
- Receive material requests from entrepreneurs
- Create and manage invoices
- Track request fulfillment status
- Real-time communication with clients

### Resident
- View property announcements
- Community messaging and group chats
- Access maintenance request information

## Subscription Plans

| Plan | Price | Features |
|------|-------|----------|
| Basic | $2.50/month | 30 bids per month |
| Premium | $4.29/month | Unlimited bids |

*Powered by Stripe payment processing*

## Key Features

- **Job Bidding System** - Competitive bidding with budget ranges
- **Real-time Messaging** - Socket.io powered instant messaging
- **Excel Import** - Bulk job creation from inspection spreadsheets
- **Material Requests** - Supplier request and invoice management
- **Reviews & Ratings** - Post-completion feedback system
- **Favorites System** - Quick access to preferred contractors
- **Email Verification** - Secure account activation
- **Role-based Access** - Protected routes per user type

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── modal/          # Modal components (profiles, forms)
│   ├── Nav.jsx         # Navigation component
│   └── ...
├── contexts/           # React Context providers
│   └── SocketContext   # Socket.io context
├── pages/              # Page components by role
│   ├── homepage/       # Property manager home
│   ├── entrepreneur/   # Entrepreneur pages
│   ├── supplier/       # Supplier pages
│   ├── resident/       # Resident pages
│   ├── messages/       # Messaging pages
│   └── works/          # Job/work pages
├── styles/             # CSS stylesheets
│   ├── modal/          # Modal-specific styles
│   ├── manager/        # Property manager styles
│   └── ...
└── App.jsx             # Main app with routing
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>

# Navigate to frontend directory
cd AirBnb-frontend--CONSTRUCTION-PLATFORM

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start development server
npm run dev
```

### Environment Variables

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Backend Repository

The backend API is located in the `AirBnb---CONSTRUCTION-PLATFORM` directory. See its README for setup instructions.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -m 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Open a Pull Request

## License

This project is proprietary software. All rights reserved.
