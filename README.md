# Diamond Management System (DMS)

A comprehensive Next.js-based web application for managing diamond inventory, processing, and transactions with Gujarati language support.

## 🏗️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Bootstrap, Radix UI components
- **Data Visualization**: Chart.js for interactive charts
- **Authentication**: JWT-based authentication with React Context
- **State Management**: React hooks and context API
- **Database**: PostgreSQL/MySQL (via API)
- **Development**: Turbopack, Fast Refresh

## 🚀 Features

### Core Features
- **Dashboard**: Interactive charts for diamond analytics
- **Inventory Management**: Complete rough diamond inventory system
- **Processing Logs**: Track diamond processing stages
- **Transactions**: Manage diamond transactions and status
- **Authentication**: Secure login/logout system
- **Gujarati Language Support**: Native Gujarati interface

### Dashboard Features
- **Interactive Charts**: Weight distribution, processing status, quality analysis
- **Pending Submissions**: Real-time tracking of pending diamond submissions
- **Pagination**: Efficient handling of large datasets
- **Status Filtering**: Filter transactions by processing status
- **Responsive Design**: Mobile-first responsive design

## 📁 Project Structure

```
my-app/
├── app/                    # Next.js app router pages
│   ├── dashboard/         # Main dashboard page
│   ├── diamond-management/ # Diamond management interface
│   ├── home/             # Home page
│   └── login/            # Authentication page
├── components/            # Reusable UI components
│   ├── ui/               # Radix UI components
│   ├── navbar.tsx        # Navigation component
│   └── forms/            # Form components
├── context/              # React contexts
│   ├── auth-context.tsx  # Authentication context
│   └── FormContext.tsx   # Form state management
├── lib/                  # Utility functions
├── public/               # Static assets
└── styles/               # Global styles
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm/yarn/pnpm
- Backend API server (localhost:4000)

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd my-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Environment Setup**
   Create `.env.local` file:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:4000
   ```

4. **Start development server**
   ```bash
   npm run dev
   # Application will be available at http://localhost:3000
   ```

## 🔐 Authentication

### Authentication Flow
1. User enters credentials
2. JWT token is stored in localStorage
3. Token is included in all API requests via Authorization header
4. Automatic logout on token expiry



## 🎯 Usage Guide

### Dashboard Navigation
1. **Dashboard Tab**: View analytics and pending submissions
2. **Inventory Tab**: Manage rough diamond inventory with pagination
3. **Processing Logs Tab**: Track diamond processing stages
4. **Transactions Tab**: View transaction history with status filtering

### Key Actions
- **Add Rough Diamond**: Use inventory management interface
- **Update Status**: Change processing status via processing logs
- **Filter Data**: Use status filters in transactions tab
- **View Analytics**: Interactive charts in dashboard tab

## 🎨 UI Components

### Chart Types
- **Bar Chart**: Weight distribution analysis
- **Doughnut Chart**: Processing status overview
- **Polar Area Chart**: Quality analysis

### Status Colors
- **Green**: Completed
- **Yellow**: Pending
- **Blue**: In Progress
- **Red**: Rejected

## 🔧 Development Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Testing
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode

# Code Quality
npm run format       # Format code with Prettier
npm run type-check   # Type checking with TypeScript
```

## 📱 Responsive Design

The application is fully responsive and works seamlessly across:
- **Desktop**: Full-featured interface
- **Tablet**: Optimized layout
- **Mobile**: Touch-friendly interface

## 🌐 Language Support

- **Primary**: Gujarati (ગુજરાતી)
- **Secondary**: English
- **RTL Support**: Ready for RTL languages

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **Role-based Access**: Admin and user roles
- **Input Validation**: Client and server-side validation
- **HTTPS Ready**: Production-ready security

## 🚀 Deployment

### Vercel Deployment
```bash
npm i -g vercel
vercel --prod
```

### Docker Deployment
```bash
docker build -t dms-app .
docker run -p 3000:3000 dms-app
```

## 📞 Support

For support or questions:
- **Email**: support@dms.com
- **Documentation**: [DMS Documentation](docs.dms.com)
- **Issues**: [GitHub Issues](github.com/dms/issues)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Tailwind CSS for utility-first styling
- Chart.js for beautiful data visualization
- Radix UI for accessible components
- Gujarati language contributors
