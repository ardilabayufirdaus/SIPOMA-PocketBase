# SIPOMA v2.0 - Plant Operations Management System

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/react-18.3.1-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.x-blue)](https://www.typescriptlang.org/)

A modern, real-time plant operations management system built with React 18, TypeScript, and Supabase. Designed for industrial manufacturing environments with comprehensive monitoring, user management, and analytics capabilities.

## ✨ Features

### 📊 Real-time Dashboard & Monitoring

- **Live KPI Tracking**: Production metrics, machine status, and performance indicators
- **Plant Operations**: Real-time machine monitoring and automated alerts
- **Packing Plant Management**: Inventory tracking and production data analysis
- **Project Management**: SLA monitoring and project lifecycle tracking

### 👥 Advanced User Management

- **Role-based Access Control**: 6-tier permission system (Super Admin to Viewer)
- **Multi-level Permissions**: Granular access control for all system modules
- **User Activity Monitoring**: Real-time user behavior tracking and audit logs
- **Secure Authentication**: JWT-based auth with Supabase integration

### 🎨 Modern UI/UX Design

- **Dark/Light Mode**: Seamless theme switching with system preference detection
- **Mobile-First Responsive**: Optimized for all device sizes
- **Modern Component Library**: Heroicons, Framer Motion animations
- **Accessibility Compliant**: WCAG 2.1 AA standards with full keyboard navigation

### 📈 Data Visualization & Analytics

- **Interactive Charts**: Recharts and Nivo for advanced data visualization
- **Real-time Updates**: Live data streaming with React Query
- **Export Capabilities**: Excel, CSV, and PDF report generation
- **Custom Dashboards**: User-configurable widgets and layouts

## 🛠️ Technology Stack

### Frontend Framework

- **React 18.3.1** - Concurrent features, hooks, and modern architecture
- **TypeScript 5.x** - Type-safe development with advanced features
- **Vite 6.3.6** - Lightning-fast build tool with HMR
- **React Router v7** - Modern routing with data loading and caching

### Styling & UI

- **Tailwind CSS 3.x** - Utility-first CSS framework
- **Framer Motion** - Production-ready animations and gestures
- **Heroicons** - Beautiful, consistent icon library
- **Headless UI** - Unstyled, accessible UI components

### Backend & Database

- **Supabase** - PostgreSQL with real-time subscriptions
- **Row Level Security** - Database-level access control
- **RESTful APIs** - Clean, documented API endpoints
- **WebSocket Support** - Real-time data synchronization

### Development Tools

- **ESLint** - Code linting and quality enforcement
- **Prettier** - Code formatting consistency
- **Jest** - Unit and integration testing
- **Vitest** - Fast, modern testing framework
- **Husky** - Git hooks for quality gates

## 🚀 Development Setup

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn package manager
- Supabase account and project

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/ardilabayufirdaus/sipoma-versi-2.git
   cd sipoma-versi-2
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

4. **Start development server**

   ```bash
   npm run dev
   ```

5. **Build for production**

   ```bash
   npm run build
   npm run preview
   ```

## 📁 Basic Project Structure

```text
sipoma-versi-2/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   ├── pages/             # Page components
│   ├── hooks/             # Custom React hooks
│   ├── stores/            # State management (Zustand)
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   └── styles/            # Global styles and design tokens
├── docs/                  # Documentation
├── tests/                 # Test files
├── scripts/               # Build and utility scripts
└── database/              # Database migrations and seeds
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run test suite
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## 🔒 Security

- Row Level Security (RLS) enabled on all database tables
- JWT-based authentication with automatic token refresh
- Input validation and sanitization
- XSS protection and CSRF prevention
- Secure password policies and encryption

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- React team for the amazing framework
- Supabase for the excellent backend-as-a-service
- Tailwind CSS for the utility-first approach
- All contributors and the open-source community

## 📞 Support

For support, email [support@sipoma.com](mailto:support@sipoma.com) or join our [Discord community](https://discord.gg/sipoma).

---

Built with ❤️ for industrial excellence

### State Management

- **React Query** - Server state management dan caching
- **Custom Hooks** - Business logic encapsulation
- **Context API** - Global state untuk theme dan auth

### Performance & Quality

- **Code Splitting** - Dynamic imports dan lazy loading
- **Bundle Optimization** - Tree shaking dan chunk splitting
- **Performance Monitoring** - Custom performance tracking
- **Error Boundaries** - Graceful error handling

## 📁 Detailed Project Structure

```text
sipoma-versi-2/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── ui/            # Base UI components
│   │   └── layouts/       # Layout components
│   ├── pages/             # Page components
│   │   ├── user_management/ # User management pages
│   │   └── ...            # Other feature pages
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utility functions
│   ├── types/             # TypeScript type definitions
│   ├── translations/      # Internationalization
│   └── styles/            # Global styles
├── docs/                  # Documentation
├── tests/                 # Test files
└── dist/                  # Build output
```

## 🚀 Quick Start

### Development Prerequisites

### Development Installation

1. **Clone repository**

   ```bash
   git clone https://github.com/ardilabayufirdaus/sipoma-versi-2.git
   cd sipoma-versi-2
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

4. **Database Setup**

   ```bash
   # Run Supabase migrations
   npm run db:migrate
   ```

5. **Development Server**

   ```bash
   npm run dev
   ```

6. **Build for Production**

   ```bash
   npm run build
   npm run preview
   ```

## 🔧 Configuration

- Otomatis build, lint, test, dan coverage via GitHub Actions (`.github/workflows/ci.yml`).
- Semua commit ke branch `main` dan PR akan menjalankan pipeline otomatis.
- Coverage report di-upload sebagai artifact.
- Deployment opsional (Vercel/Netlify/Custom server).
- Observability: Integrasi Sentry (error tracking) dan custom logging.

### Environment Variables

- Semua variabel rahasia diletakkan di `.env` (lihat `.env.example`).
- File `.env` sudah di-ignore di `.gitignore`.

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

### Build Configuration

- **Vite Config**: Optimized untuk production dengan code splitting
- **Tailwind Config**: Custom color palette dan responsive breakpoints
- **TypeScript Config**: Strict mode dengan modern ES features

## 📊 Performance Optimization

### Bundle Analysis

- **Code Splitting**: Automatic chunk splitting berdasarkan routes
- **Tree Shaking**: Remove unused code secara otomatis
- **Lazy Loading**: Components dimuat on-demand
- **Compression**: Gzip compression untuk production builds
  Report coverage otomatis di pipeline CI/CD.

### Monitoring

- **Performance Tracking**: Custom performance monitoring utility

## 🧪 Testing

- Mengikuti OWASP best practices untuk web app security.
- Dependency audit otomatis setiap install/update.
- Tidak ada secrets hardcoded di repo.

### Unit Tests

- 🛠️ Integrasi CI/CD pipeline (build, lint, test, coverage, deploy)
- 🔒 Implementasi dotenv & secrets management
- 🧪 Coverage report otomatis
- 📦 Dependency audit & auto-fix
- 🧹 Linting & formatting konsisten

```bash
npm run test
```

### Integration Tests

```bash
npm run test:integration
```

### E2E Tests

```bash
npm run test:e2e
```

## 📚 API Documentation

### Authentication

- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user

### User Management

- `GET /users` - List users
- `POST /users` - Create user
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user

### Plant Operations

- `GET /machines` - Get machine status
- `GET /kpis` - Get KPI data
- `GET /alerts` - Get system alerts

## 🤝 API Development Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Standards

- **ESLint**: Airbnb config dengan TypeScript support
- **Prettier**: Consistent code formatting
- **Husky**: Pre-commit hooks untuk quality checks
- **Commitlint**: Conventional commit messages

## 📝 Changelog

### v2.0.0 (Current)

- ✨ Complete redesign dengan modern UI/UX
- 🔧 Migration ke React 18 dan TypeScript
- 📊 Real-time dashboard dengan live updates
- 👥 Advanced user management system
- 🎨 Dark/light mode support
- 📱 Mobile-responsive design
- 🚀 Performance optimizations
- 🛡️ Enhanced security dengan RLS

## 📄 Project License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

### Ardila Bayu Firdaus

- GitHub: [@ardilabayufirdaus](https://github.com/ardilabayufirdaus)
- LinkedIn: [Ardila Bayu Firdaus](https://linkedin.com/in/ardilabayufirdaus)

## 🙏 Additional Acknowledgments

- React Team untuk framework yang powerful
- Supabase untuk backend-as-a-service
- Tailwind CSS untuk utility-first CSS
- Heroicons untuk beautiful icons
- Recharts untuk data visualization

---

**SIPOMA v2.0** - Modern Production Monitoring System
