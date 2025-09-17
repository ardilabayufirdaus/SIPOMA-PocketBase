# SIPOMA v2.0 - Sistem Informasi Produksi dan Monitoring Aplikasi

Sistem manajemen produksi modern dengan dashboard real-time, user management, dan monitoring komprehensif untuk industri manufaktur.

## 🚀 Fitur Utama

### 📊 Dashboard & Monitoring

- **Real-time Dashboard**: Monitoring KPI produksi, mesin, dan performa
- **Plant Operations**: Tracking status mesin dan alert sistem
- **Packing Plant**: Manajemen data packing dan inventory
- **Project Management**: SLA tracking dan project monitoring

### 👥 User Management

- **Role-based Access Control**: Super Admin, Admin, Manager, Supervisor, Operator, Viewer
- **Multi-level Permissions**: Dashboard, User Management, Plant Operations, Packing Plant, Project Management, System Settings
- **User Activity Tracking**: Monitoring aktivitas user real-time
- **Secure Authentication**: JWT-based authentication dengan Supabase

### 🎨 Modern UI/UX

- **Dark/Light Mode**: Support tema gelap dan terang
- **Responsive Design**: Mobile-first approach dengan Tailwind CSS
- **Modern Components**: Heroicons, Framer Motion animations
- **Accessibility**: WCAG compliant dengan keyboard navigation

### 📈 Data Visualization

- **Recharts Integration**: Interactive charts untuk data analisis
- **Nivo Charts**: Advanced data visualization
- **Real-time Updates**: Live data streaming dengan React Query
- **Export Capabilities**: Excel/CSV export untuk reporting

## 🛠️ Tech Stack

### Frontend

- **React 18** - Modern React dengan hooks dan concurrent features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool dan HMR
- **Tailwind CSS** - Utility-first CSS framework
- **React Router v7** - Modern routing dengan data loading

### Backend & Database

- **Supabase** - PostgreSQL database dengan real-time subscriptions
- **Row Level Security** - Database-level security
- **RESTful APIs** - Clean API design patterns

### State Management

- **React Query** - Server state management dan caching
- **Custom Hooks** - Business logic encapsulation
- **Context API** - Global state untuk theme dan auth

### Performance & Quality

- **Code Splitting** - Dynamic imports dan lazy loading
- **Bundle Optimization** - Tree shaking dan chunk splitting
- **Performance Monitoring** - Custom performance tracking
- **Error Boundaries** - Graceful error handling

## 📁 Project Structure

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

### Prerequisites

### Installation

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

## 🤝 Contributing

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

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Ardila Bayu Firdaus**

- GitHub: [@ardilabayufirdaus](https://github.com/ardilabayufirdaus)
- LinkedIn: [Ardila Bayu Firdaus](https://linkedin.com/in/ardilabayufirdaus)

## 🙏 Acknowledgments

- React Team untuk framework yang powerful
- Supabase untuk backend-as-a-service
- Tailwind CSS untuk utility-first CSS
- Heroicons untuk beautiful icons
- Recharts untuk data visualization

---

**SIPOMA v2.0** - Modern Production Monitoring System
