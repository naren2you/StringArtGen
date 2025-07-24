# 🧵 StringArtGen

A modern web-based tool to convert images into beautiful nail-to-nail string art using intelligent optimization algorithms. Built with **Angular 19** (frontend) and **Node.js** (backend) with **MongoDB** for data persistence.

![StringArtGen Demo](https://img.shields.io/badge/Angular-19-red?style=for-the-badge&logo=angular)
![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-6+-blue?style=for-the-badge&logo=mongodb)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue?style=for-the-badge&logo=typescript)

---

## 🚀 Features

- 🖼️ **Image Upload**: Support for JPG, PNG, and WebP formats
- 🔘 **Customizable Nails**: Set number of nails (50-512) for precision
- 🧶 **String Optimization**: Intelligent algorithm for optimal string placement
- 📐 **Real-time Preview**: Live rendering using HTML5 Canvas/SVG
- 📊 **Progress Tracking**: Visual feedback during generation
- 📥 **Export Options**: Download as JSON, SVG, or PNG
- 💾 **Project History**: Save and manage your string art projects
- 🎨 **Custom Themes**: Multiple color schemes and nail styles
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Angular 19 with TypeScript
- **Styling**: SCSS with CSS Grid/Flexbox
- **Rendering**: HTML5 Canvas & SVG
- **State Management**: Angular Services & RxJS
- **UI Components**: Custom components (no external UI libraries)

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Image Processing**: Sharp, Multer
- **Authentication**: JWT tokens
- **File Storage**: Local file system + cloud storage ready

### Development Tools
- **Package Manager**: npm
- **Build Tool**: Angular CLI
- **Testing**: Jasmine & Karma
- **Linting**: ESLint + Prettier
- **Version Control**: Git

---

## 📁 Project Structure

```
stringArtGen/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── image-upload/
│   │   │   ├── string-preview/
│   │   │   ├── settings-panel/
│   │   │   └── export-options/
│   │   ├── services/
│   │   │   ├── api.service.ts
│   │   │   ├── string-art.service.ts
│   │   │   └── auth.service.ts
│   │   ├── models/
│   │   │   ├── string-art.model.ts
│   │   │   └── user.model.ts
│   │   ├── guards/
│   │   └── pipes/
│   ├── assets/
│   │   ├── images/
│   │   └── icons/
│   └── styles/
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── middleware/
│   └── uploads/
├── docs/
├── tests/
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **MongoDB** (v6 or higher)
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/naren2you/StringArtGen.git
   cd StringArtGen
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   npm install
   
   # Install backend dependencies (if separate)
   cd backend && npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Edit .env with your configuration
   nano .env
   ```

4. **Database Setup**
   ```bash
   # Start MongoDB (if not running)
   mongod
   
   # Or use MongoDB Atlas (cloud)
   ```

5. **Start Development Servers**
   ```bash
   # Frontend (Angular)
   npm start
   
   # Backend (Node.js) - in separate terminal
   npm run server
   ```

6. **Open Application**
   - Frontend: http://localhost:4200
   - Backend API: http://localhost:3000

---

## 🧠 How It Works

### 🔵 Nail Layout Algorithm

1. **Circular Distribution**: Nails are placed evenly around a circle
2. **Coordinate Calculation**: Each nail gets (x, y) coordinates
3. **Spacing Formula**: `angle = 360° / nailCount`

### 🧮 String Optimization Algorithm

1. **Image Processing**:
   - Convert to grayscale
   - Apply Gaussian blur for smoothness
   - Normalize pixel values

2. **Greedy Optimization**:
   - Start from a random nail
   - For each iteration:
     - Evaluate all possible connections
     - Calculate darkness reduction
     - Select optimal connection
     - Update pixel buffer

3. **Quality Metrics**:
   - Contrast preservation
   - Detail retention
   - String efficiency

---

## 📖 Usage Guide

### 1. Upload Image
- Click "Choose File" or drag & drop
- Supported formats: JPG, PNG, WebP
- Recommended size: 512x512 to 1024x1024

### 2. Configure Settings
- **Nails**: 50-512 (higher = more detail)
- **Strings**: 100-3000 (higher = darker image)
- **Algorithm**: Greedy, Genetic, or Hybrid
- **Color**: Black, White, or Custom

### 3. Generate String Art
- Click "Generate" to start processing
- Monitor progress in real-time
- Preview updates automatically

### 4. Export Results
- **JSON**: For machine instructions
- **SVG**: Vector format for scaling
- **PNG**: Raster image for sharing
- **Instructions**: Step-by-step guide

---

## 🔧 Configuration

### Environment Variables

```env
# Database
MONGODB_URI=mongodb://localhost:27017/stringartgen
MONGODB_URI_PROD=mongodb+srv://...

# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# CORS
CORS_ORIGIN=http://localhost:4200
```

### Angular Configuration

```json
// angular.json
{
  "projects": {
    "stringArtGen": {
      "architect": {
        "build": {
          "options": {
            "outputPath": "dist/string-art-gen",
            "assets": ["src/assets"]
          }
        }
      }
    }
  }
}
```

---

## 🧪 Testing

### Frontend Tests
```bash
# Unit tests
npm test

# E2E tests
npm run e2e

# Coverage report
npm run test:coverage
```

### Backend Tests
```bash
# Unit tests
npm run test:server

# API tests
npm run test:api

# Integration tests
npm run test:integration
```

---

## 📦 API Reference

### Authentication
```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/profile
```

### String Art Generation
```http
POST /api/string-art/generate
GET  /api/string-art/:id
PUT  /api/string-art/:id
DELETE /api/string-art/:id
```

### Projects
```http
GET  /api/projects
POST /api/projects
GET  /api/projects/:id
PUT  /api/projects/:id
DELETE /api/projects/:id
```

### Example Request
```javascript
const response = await fetch('/api/string-art/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'multipart/form-data',
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
// {
//   "id": "507f1f77bcf86cd799439011",
//   "nails": 256,
//   "strings": 2000,
//   "coordinates": [
//     { "from": 0, "to": 87 },
//     { "from": 87, "to": 146 }
//   ],
//   "preview": "data:image/png;base64,...",
//   "createdAt": "2024-01-15T10:30:00Z"
// }
```

---

## 🚀 Deployment

### Frontend (Angular)
```bash
# Build for production
npm run build:prod

# Deploy to Netlify/Vercel
npm run deploy
```

### Backend (Node.js)
```bash
# Build and start
npm run build
npm start

# Using PM2
pm2 start ecosystem.config.js
```

### Docker
```bash
# Build image
docker build -t stringartgen .

# Run container
docker run -p 3000:3000 stringartgen
```

---

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow Angular style guide
- Write unit tests for new features
- Update documentation
- Use conventional commits

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Angular Team** for the amazing framework
- **Node.js Community** for backend tools
- **MongoDB** for the database solution
- **Open Source Contributors** for inspiration

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/naren2you/StringArtGen/issues)
- **Discussions**: [GitHub Discussions](https://github.com/naren2you/StringArtGen/discussions)
- **Email**: naren2you@gmail.com

---

**Made with ❤️ by [naren2you](https://github.com/naren2you)**
