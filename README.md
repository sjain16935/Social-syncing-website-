# Sync - Event Hosting Platform

A modern, full-stack event hosting platform built with Node.js, Express, MongoDB, and vanilla JavaScript.

## 🚀 Features

- **User Authentication** - Secure JWT-based authentication
- **Event Management** - Create, edit, and manage events
- **Payment Integration** - Razorpay payment gateway
- **Image Upload** - Cloudinary integration for event images
- **Real-time Dashboard** - Analytics and revenue tracking
- **Responsive Design** - Mobile-first approach
- **Search & Filter** - Advanced event discovery
- **Booking System** - Complete ticket booking workflow

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Multer** - File upload
- **Cloudinary** - Image storage
- **Razorpay** - Payment processing

### Frontend
- **Vanilla JavaScript** - No frameworks
- **HTML5** - Semantic markup
- **CSS3** - Modern styling
- **Font Awesome** - Icons
- **Google Fonts** - Typography

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account
- Cloudinary account
- Razorpay account

### Setup

1. **Clone the repository**
   \`\`\`bash
   git clone <repository-url>
   cd sync-event-platform
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Environment Setup**
   \`\`\`bash
   cp .env.example .env
   \`\`\`

4. **Configure environment variables**
   \`\`\`env
   # Server
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5000

   # Database
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sync-events

   # JWT
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRE=7d
   BCRYPT_ROUNDS=12

   # Cloudinary
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret

   # Razorpay
   RAZORPAY_KEY_ID=your-key-id
   RAZORPAY_KEY_SECRET=your-key-secret

   # Email
   EMAIL_FROM=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   \`\`\`

5. **Start the application**
   \`\`\`bash
   # Development
   npm run dev

   # Production
   npm start
   \`\`\`

6. **Access the application**
   - Frontend: http://localhost:5000
   - API: http://localhost:5000/api

## 🏗️ Project Structure

\`\`\`
sync-event-platform/
├── models/              # Database models
│   ├── User.js
│   ├── Event.js
│   └── Booking.js
├── routes/              # API routes
│   ├── auth.js
│   ├── events.js
│   ├── bookings.js
│   ├── payments.js
│   └── users.js
├── middleware/          # Custom middleware
│   ├── auth.js
│   └── upload.js
├── public/              # Frontend files
│   ├── css/
│   ├── js/
│   ├── images/
│   └── *.html
├── server.js            # Main server file
├── package.json
└── README.md
\`\`\`

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Events
- `GET /api/events` - Get all events
- `GET /api/events/featured` - Get featured events
- `GET /api/events/my` - Get user's events
- `GET /api/events/:id` - Get single event
- `POST /api/events` - Create event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/my` - Get user's bookings
- `GET /api/bookings/:id` - Get single booking
- `PUT /api/bookings/:id/cancel` - Cancel booking

### Payments
- `POST /api/payments/orders` - Create payment order
- `POST /api/payments/verify` - Verify payment

### Users
- `GET /api/users/dashboard` - Get dashboard data
- `GET /api/users/analytics` - Get analytics data

## 🚀 Deployment

### Heroku Deployment

1. **Create Heroku app**
   \`\`\`bash
   heroku create your-app-name
   \`\`\`

2. **Set environment variables**
   \`\`\`bash
   heroku config:set NODE_ENV=production
   heroku config:set MONGODB_URI=your-mongodb-uri
   # ... set all other environment variables
   \`\`\`

3. **Deploy**
   \`\`\`bash
   git push heroku main
   \`\`\`

### Vercel Deployment

1. **Install Vercel CLI**
   \`\`\`bash
   npm i -g vercel
   \`\`\`

2. **Deploy**
   \`\`\`bash
   vercel
   \`\`\`

## 🔒 Security Features

- JWT authentication
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation
- File upload restrictions

## 📱 Features Overview

### For Event Organizers
- Create and manage events
- Upload event images
- Set pricing and capacity
- Track bookings and revenue
- View detailed analytics
- Manage attendees

### For Attendees
- Browse and search events
- Filter by location, category, date
- Secure payment processing
- Booking management
- Event recommendations
- Mobile-responsive experience

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@sync-events.com or create an issue in the repository.

## 🙏 Acknowledgments

- Font Awesome for icons
- Google Fonts for typography
- Razorpay for payment processing
- Cloudinary for image management
- MongoDB Atlas for database hosting
