# Menu Website

A modern, full-stack web application for managing a menu with user authentication, real-time updates, cart/checkout, and analytics.

## Features

### Security & Infrastructure
- **Helmet.js** security headers
- **Rate Limiting** — 200 req/15min global, 20 req/15min on auth endpoints
- **JWT Access + Refresh Tokens** — auto-rotation, 2h access / 7d refresh
- **Health Endpoint** — `GET /health` checks DB connectivity

### User Features
- **Browse Menu** — search, category filter, max-price filter
- **Add to Cart** — persistent cart via localStorage
- **Checkout** — place orders with notes, tracked per-user
- **Real-time Order Status** — Socket.io notifies when order status changes

### Admin Features
- **Menu Management** — CRUD with category assignment, optimistic updates, confirm modal before delete
- **User Management** — change roles, delete users, optimistic updates
- **Analytics Dashboard** — orders/day chart, orders by status pie chart, top items bar chart, summary KPIs
- **Dark Mode Toggle** — system-wide, persisted to localStorage
- **Real-time Order Alerts** — toast on new order via Socket.io

### Database (PostgreSQL + Sequelize)
- `menu_items` — soft delete (`deletedAt`), indexed by category/name
- `categories` — icon, description
- `orders` + `order_items` — transactional creation, status ENUM
- `audit_logs` — JSONB details, tracks all admin actions
- Migrations + seeders included

## Tech Stack

### Frontend
- React 18 + Vite
- Tailwind CSS (dark mode: class)
- Context API (Auth, Cart, Theme)
- react-hot-toast, recharts, socket.io-client

### Backend
- Express.js + Node.js (port 3001)
- Sequelize ORM v6 + PostgreSQL 18
- Helmet, express-rate-limit, Socket.io
- JWT (jsonwebtoken)

## Setup & Installation

### Prerequisites
- Node.js LTS installed

### Installation Steps

1. **Install Backend Dependencies**
## Setup & Installation

### Prerequisites
- Node.js LTS
- PostgreSQL 18 (Windows service: `postgresql-x64-18`)

### Quick Start

1. **Start PostgreSQL** (run once per session if service is stopped):
   ```powershell
   # Remove stale PID if needed, then start
   Remove-Item "C:\Program Files\PostgreSQL\18\data\postmaster.pid" -Force -ErrorAction SilentlyContinue
   & "C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe" start -D "C:\Program Files\PostgreSQL\18\data" -l "C:\Temp\pg.log" -w -t 30
   ```

2. **Install dependencies:**
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

3. **Start backend:**
   ```bash
   cd backend
   npm start        # or: node server.js
   ```
   Runs on http://localhost:3001

4. **Start frontend:**
   ```bash
   cd frontend
   npm run dev
   ```
   Runs on http://localhost:5173

## Demo Credentials

| Role  | Username | Password |
|-------|----------|----------|
| Admin | `admin`  | `admin123` |
| User  | `user`   | `user123`  |

## API Endpoints

### Authentication
- `POST /auth/register` — Register
- `POST /auth/login` — Login → `{ accessToken, refreshToken, user }`
- `POST /auth/refresh` — Rotate refresh token
- `POST /auth/logout` — Invalidate refresh token
- `POST /auth/verify` — Verify access token
- `GET /health` — Server + DB health check

### Menu
- `GET /menu` — Paginated: `?page=&limit=&search=&category=`
- `GET /menu/all` — All items (no pagination)
- `POST /menu` — Create (admin)
- `PUT /menu/:id` — Update (admin)
- `DELETE /menu/:id` — Soft delete (admin)

### Categories, Users, Orders
- `GET /categories` — All categories
- `GET /users` — All users (admin)
- `POST /orders` — Place order (authenticated)
- `PUT /orders/:id/status` — Update status (admin)

### Analytics (admin)
- `GET /analytics/summary`
- `GET /analytics/orders-by-day`
- `GET /analytics/top-items`
- `GET /analytics/orders-by-status`
- `GET /analytics/revenue-by-category`

## Project Structure

```
web/
├── backend/
│   ├── server.js              # Express + Socket.io + Helmet + rate limiting
│   ├── database.js            # Sequelize connection
│   ├── models/                # User, MenuItem, Category, Order, OrderItem, AuditLog
│   ├── routes/                # auth, menu, users, categories, orders, analytics
│   ├── middleware/auth.js     # JWT middleware
│   ├── utils/audit.js         # Audit log helper
│   ├── migrations/            # Sequelize migrations
│   ├── seeders/               # Dev data seeders
│   └── .env                   # DB credentials, JWT_SECRET
├── frontend/
│   └── src/
│       ├── App.jsx            # Root — ThemeProvider, CartProvider, AuthProvider
│       ├── contexts/
│       │   ├── AuthContext.jsx   # JWT + refresh token + authFetch
│       │   ├── CartContext.jsx   # Cart state (localStorage)
│       │   └── ThemeContext.jsx  # Dark/light mode
│       ├── components/
│       │   └── ConfirmModal.jsx  # Reusable delete confirm dialog
│       └── pages/
│           ├── AdminPage.jsx     # Menu/Users/Analytics tabs
│           ├── UserPage.jsx      # Browse + filter + Add to Cart
│           ├── CartPage.jsx      # Cart + checkout
│           ├── Login.jsx
│           └── Register.jsx
└── README.md
```
- Safari (latest)
- Edge (latest)

## Future Enhancements

- Database integration (PostgreSQL/MongoDB)
- Image upload for menu items
- Category management
- User profile management
- Admin dashboard
- Export menu to PDF

## License

MIT