# 💼 Marketstack - Brokerage Platform

A modern, full-stack brokerage application built with Next.js, Prisma, and TypeScript. Track your portfolio, buy and sell stocks, and monitor your transaction history.

![Dashboard Preview](https://img.shields.io/badge/Next.js-16.0-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-6.18-2D3748?style=for-the-badge&logo=prisma)

## ✨ Features

### 📊 Portfolio Management
- **Real-time Dashboard** - View your wallet balance and brokerage value at a glance
- **Portfolio Distribution** - Visual pie chart showing asset allocation
- **Historical Charts** - Track wallet and brokerage performance over time
- **Position Tracking** - Monitor all your stock positions with P&L calculations

### 💰 Trading
- **Buy Assets** - Purchase stocks with real-time balance validation
- **Sell Positions** - Liquidate positions partially or fully
- **Transaction History** - Complete audit trail of all trades
- **Smart Validation** - Client and server-side checks for sufficient funds

### 🔐 Security
- **JWT Authentication** - Secure session management
- **HTTP-only Cookies** - Protection against XSS attacks
- **bcrypt Password Hashing** - Industry-standard encryption
- **Server-side Authorization** - All routes protected

### 🎨 UI/UX
- **Modern Design** - Clean, professional interface with Tailwind CSS
- **Responsive Layout** - Works on desktop, tablet, and mobile
- **shadcn/ui Components** - Beautiful, accessible components
- **Dark Mode Ready** - (Coming soon)

## 🚀 Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type safety throughout
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - High-quality component library
- **Recharts** - Interactive charts and visualizations
- **TanStack Query** - Server state management
- **React Hook Form** - Form handling with validation
- **Zod** - Schema validation
- **nuqs** - URL state management

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Prisma** - Type-safe ORM
- **SQLite** - Lightweight database (production-ready with PostgreSQL)
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm/yarn
- Git

### Setup

1. **Clone the repository**
```bash
   git clone <your-repo-url>
   cd marketstack
```

2. **Install dependencies**
```bash
   npm install
   # or
   yarn install
```

3. **Initialize the database**
```bash
   # Generate Prisma Client, create database, and seed with sample data
   npm run db:setup
   # or
   yarn db:setup
```

4. **Start the development server**
```bash
   npm run dev
   # or
   yarn dev
```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔑 Default Credentials
```
Email: test@example.com
Password: password123
```

**Initial Balance:** $88,000 in wallet + $12,000 in brokerage

## 📁 Project Structure
```
marketstack/
├── prisma/
│   ├── schema.prisma        # Database schema
│   ├── seed.ts              # Seed data
│   └── dev.db               # SQLite database (generated)
├── src/
│   ├── app/
│   │   ├── api/             # API routes
│   │   │   ├── buy/
│   │   │   ├── sell/
│   │   │   ├── login/
│   │   │   ├── logout/
│   │   │   ├── me/
│   │   │   ├── positions/
│   │   │   ├── wallet-balances/
│   │   │   ├── brokerage-values/
│   │   │   ├── symbols/
│   │   │   └── transactions/
│   │   ├── login/           # Login page
│   │   ├── transactions/    # Transactions page
│   │   ├── page.tsx         # Dashboard
│   │   └── layout.tsx       # Root layout
│   ├── components/
│   │   ├── ui/              # shadcn components
│   │   ├── layout.tsx       # Dashboard layout
│   │   ├── buy-asset-dialog.tsx
│   │   └── sell-position-dialog.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx  # Auth state management
│   ├── hooks/
│   │   ├── use-brokerage.ts
│   │   ├── use-login.ts
│   │   ├── use-symbols.ts
│   │   └── use-transactions.ts
│   └── lib/
│       ├── auth.ts          # Auth utilities
│       ├── prisma.ts        # Prisma client
│       └── wallet.ts        # Wallet utilities
├── package.json
└── README.md
```

## 🛠️ Available Scripts
```bash
# Development
npm run dev                 # Start dev server
npm run build              # Build for production
npm run start              # Start production server

# Database
npm run db:setup           # Generate + push + seed (one command setup)
npm run db:studio          # Open Prisma Studio
npm run db:reset           # Reset database with fresh seed
```

## 🗄️ Database Schema

### Models

- **User** - User accounts with authentication
- **Position** - Stock positions held by users
- **WalletBalance** - Historical wallet balance records
- **BrokerageValue** - Historical brokerage value records
- **Symbol** - Available stocks for trading
- **Transaction** - Complete transaction history

### Relationships
```
User (1) ──→ (n) Position
User (1) ──→ (n) WalletBalance
User (1) ──→ (n) BrokerageValue
User (1) ──→ (n) Transaction
```

## 🔄 Data Flow

### Buy Flow
1. User selects symbol and shares
2. Client validates sufficient wallet balance
3. Server validates and processes transaction
4. Creates/updates position
5. Decreases wallet balance
6. Increases brokerage value
7. Records transaction

### Sell Flow
1. User selects position and shares to sell
2. Client validates sufficient shares
3. Server validates and processes transaction
4. Updates/deletes position
5. Increases wallet balance
6. Decreases brokerage value
7. Records transaction

## 🎯 Future Enhancements

- [ ] Real-time stock prices (integration with market data API)
- [ ] Limit orders and stop-loss
- [ ] Portfolio analytics and insights
- [ ] Watchlist functionality
- [ ] Price alerts and notifications
- [ ] Dark mode
- [ ] Multi-currency support
- [ ] Export transactions to CSV
- [ ] Advanced charting with indicators
- [ ] Social features (leaderboard, sharing)
- [ ] User registration and email verification
- [ ] Password reset functionality
- [ ] Two-factor authentication

## 🚀 Deployment

### Quick Deploy

The application uses SQLite by default, which works great for development. For production:

1. **Build the application**
```bash
   npm run build
```

2. **Start production server**
```bash
   npm run start
```

### Production Considerations

- **Database**: Migrate to PostgreSQL or MySQL for production
- **JWT Secret**: Use a secure, randomly generated secret
- **HTTPS**: Always use HTTPS in production
- **CORS**: Configure appropriate CORS settings

## 🐛 Known Issues

- Stock prices are static (seed data) - integrate with real market data API
- No email verification on signup
- Single user session (no multi-device management)
- SQLite is used (suitable for development, migrate to PostgreSQL for production)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful component library
- [Recharts](https://recharts.org/) - Composable charting library
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [TanStack Query](https://tanstack.com/query) - Powerful data synchronization

## 📞 Support

For support, open an issue in the repository.

---

**Built with ❤️ using Next.js and TypeScript**
