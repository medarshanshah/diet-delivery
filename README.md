# HealthyBites - Health-Focused Food Delivery App

A comprehensive health-focused food delivery platform built for Nepal, similar to Bhoj and FoodMandu but with specialized features for nutrition tracking, dietitian consultations, and AI-powered meal recommendations.

## 🌟 Features

### Core Features
- **User Registration & Authentication** - Multi-role system (Customer, Dietitian, Vendor, Admin)
- **Health Profile Management** - Comprehensive health data including dietary restrictions, medical conditions, and goals
- **Food Ordering System** - Single orders, subscriptions, and hospital packages
- **Real-time Order Tracking** - Live GPS tracking with Socket.IO
- **Dietitian Consultations** - 24/7 chat, voice, and video consultations
- **AI Meal Recommendations** - Personalized suggestions based on health goals
- **Payment Integration** - eSewa, Khalti, cards, and cash on delivery
- **Nutrition Tracking** - Detailed macro and micronutrient analysis

### Advanced Features
- **Hospital Integration** - Specialized meal plans for patients
- **Health Challenges** - Gamified wellness programs
- **Subscription Meals** - Daily/weekly/monthly healthy meal plans
- **Vendor Dashboard** - Restaurant and cloud kitchen management
- **Admin Panel** - Complete platform management
- **Mobile App** - React Native Android application
- **Real-time Notifications** - Order updates, health tips, and reminders

## 🏗️ Architecture

### Technology Stack

#### Backend
- **Framework**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Cache**: Redis for sessions and caching
- **Authentication**: JWT with refresh tokens
- **Real-time**: Socket.IO for live features
- **File Upload**: Cloudinary integration
- **Email**: NodeMailer for transactional emails
- **SMS**: Twilio for notifications
- **AI**: OpenAI GPT for meal recommendations
- **Payments**: Stripe, eSewa, Khalti integration

#### Frontend
- **Web**: React 18 with TypeScript
- **Mobile**: React Native (Android focus)
- **State Management**: Context API and custom hooks
- **Styling**: Tailwind CSS for web, StyleSheet for mobile
- **Forms**: React Hook Form with validation
- **HTTP Client**: Axios with interceptors

#### Shared
- **TypeScript**: Full type safety across all applications
- **Monorepo**: Yarn workspaces for code sharing
- **Common Types**: Shared interfaces and utilities

## 📁 Project Structure

```
healthy-food-delivery-app/
├── backend/                 # Node.js Express API
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Custom middleware
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # Express routes
│   │   ├── services/       # Business logic services
│   │   ├── utils/          # Utility functions
│   │   ├── config/         # Configuration files
│   │   └── server.ts       # Main server file
│   ├── .env.example        # Environment variables template
│   ├── package.json
│   └── tsconfig.json
├── frontend/               # React web application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── context/       # React context providers
│   │   ├── services/      # API service layer
│   │   ├── utils/         # Utility functions
│   │   └── App.tsx        # Main app component
│   ├── public/
│   ├── package.json
│   └── tailwind.config.js
├── mobile/                 # React Native app
│   ├── src/
│   │   ├── screens/       # Screen components
│   │   ├── components/    # Reusable components
│   │   ├── navigation/    # Navigation configuration
│   │   ├── services/      # API services
│   │   └── utils/         # Utilities
│   ├── android/           # Android specific files
│   ├── package.json
│   └── metro.config.js
├── shared/                 # Shared code and types
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Common utility functions
│   └── constants/         # Shared constants
├── package.json           # Root package.json for workspace
└── README.md             # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- MongoDB (local or Atlas)
- Redis (local or cloud)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd healthy-food-delivery-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   # This will install dependencies for all workspaces
   ```

3. **Set up environment variables**
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your configuration
   ```

4. **Start the development servers**
   ```bash
   # Start both backend and frontend
   npm run dev
   
   # Or start individually
   npm run dev:backend    # Backend on http://localhost:5000
   npm run dev:frontend   # Frontend on http://localhost:3000
   npm run dev:mobile     # React Native Metro bundler
   ```

### Environment Variables

Create `backend/.env` file with the following variables:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/healthy-food-delivery
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_REFRESH_EXPIRE=30d

# Email (Gmail/SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890

# File Upload (Cloudinary)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Payment Gateways
ESEWA_MERCHANT_ID=your-esewa-id
ESEWA_SECRET_KEY=your-esewa-secret
KHALTI_SECRET_KEY=your-khalti-secret
STRIPE_SECRET_KEY=your-stripe-secret

# AI Services
OPENAI_API_KEY=your-openai-key

# Maps
GOOGLE_MAPS_API_KEY=your-google-maps-key
```

## 📱 API Documentation

### Authentication Endpoints

```bash
POST /api/auth/register      # User registration
POST /api/auth/login         # User login
POST /api/auth/verify-email  # Email verification
POST /api/auth/verify-phone  # Phone verification
POST /api/auth/resend-otp    # Resend OTP
POST /api/auth/logout        # User logout
POST /api/auth/refresh       # Refresh access token
GET  /api/auth/me           # Get current user
```

### User Management

```bash
GET    /api/users/profile              # Get user profile
PUT    /api/users/profile              # Update user profile
POST   /api/users/health-profile       # Create health profile
PUT    /api/users/health-profile       # Update health profile
GET    /api/users/addresses            # Get user addresses
POST   /api/users/addresses            # Add new address
```

### Food & Menu

```bash
GET    /api/food/items                 # Get food items (with filters)
GET    /api/food/categories            # Get food categories
GET    /api/food/search                # Search food items
GET    /api/food/recommendations       # Get personalized recommendations
GET    /api/vendors                    # Get all vendors
GET    /api/vendors/:id/menu          # Get vendor menu
```

### Orders

```bash
POST   /api/orders                     # Create new order
GET    /api/orders                     # Get user orders
GET    /api/orders/:id                 # Get specific order
PUT    /api/orders/:id/cancel          # Cancel order
GET    /api/orders/:id/track           # Track order
POST   /api/orders/:id/rating          # Rate order
```

### Payments

```bash
POST   /api/payments/initiate          # Initiate payment
POST   /api/payments/verify            # Verify payment
GET    /api/payments/methods           # Get available payment methods
```

### Dietitian Services

```bash
GET    /api/dietitians                 # Get available dietitians
GET    /api/dietitians/:id             # Get dietitian profile
POST   /api/dietitians/:id/book        # Book consultation
GET    /api/consultations              # Get user consultations
POST   /api/consultations/:id/join     # Join consultation
```

### AI Services

```bash
POST   /api/ai/meal-plan               # Generate AI meal plan
POST   /api/ai/recommendations         # Get meal recommendations
POST   /api/ai/nutrition-analysis      # Analyze nutrition
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run backend tests
npm run test:backend

# Run frontend tests
npm run test:frontend

# Run tests in watch mode
npm run test:watch
```

## 🚀 Deployment

### Backend Deployment

1. **Build the application**
   ```bash
   npm run build:backend
   ```

2. **Deploy to your preferred platform**
   - **Heroku**: Use the included `Procfile`
   - **DigitalOcean**: Use Docker or PM2
   - **AWS**: Use Elastic Beanstalk or EC2
   - **Vercel**: Use the Node.js template

### Frontend Deployment

1. **Build the application**
   ```bash
   npm run build:frontend
   ```

2. **Deploy static files**
   - **Netlify**: Drag and drop `build` folder
   - **Vercel**: Connect GitHub repository
   - **AWS S3**: Upload to S3 bucket with CloudFront

### Mobile App Deployment

1. **Android APK**
   ```bash
   cd mobile
   npx react-native build-android --mode=release
   ```

2. **Google Play Store**
   - Follow React Native deployment guide
   - Use Android App Bundle format

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Backend Development**: Node.js, Express, MongoDB
- **Frontend Development**: React, TypeScript, Tailwind CSS
- **Mobile Development**: React Native
- **DevOps**: Docker, CI/CD, Cloud deployment
- **UI/UX Design**: Figma, user experience optimization

## 🆘 Support

For support, email support@healthybites.com.np or join our Slack channel.

## 🗺️ Roadmap

### Phase 1 (Current)
- [x] User authentication and profiles
- [x] Basic food ordering system
- [x] Payment integration
- [ ] Dietitian consultation system
- [ ] AI meal recommendations

### Phase 2
- [ ] Advanced nutrition tracking
- [ ] Hospital integration
- [ ] Health challenges and gamification
- [ ] Advanced analytics dashboard

### Phase 3
- [ ] Machine learning recommendations
- [ ] IoT device integration
- [ ] Advanced subscription management
- [ ] Multi-language support (Nepali)

---

**HealthyBites** - Delivering health, one meal at a time 🥗💚