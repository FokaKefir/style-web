# AI the Artist – StyleApp Web 🎨

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19.1.0-61DAFB?logo=react)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-11.9.0-FFCA28?logo=firebase)](https://firebase.google.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4.1-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

**Transform your everyday photos into stunning artwork using Neural Style Transfer**

[Features](#features) • [Demo](#demo) • [Installation](#installation) • [Usage](#usage) • [Architecture](#architecture) • [Contributing](#contributing)

</div>



## 🏆 Recognition

This project received top academic honors:
- **Bachelor Thesis Grade**: 10/10
- **1st Place** at the 2024 Scientific Student Conference
- **Accenture Special Award**
- **Presentation** at the 2025 National Scientific Student Conference



## 📖 Overview

**AI the Artist** (StyleApp) is a cross-platform creative image stylization application that empowers users to transform their photos into artistic masterpieces using advanced Neural Style Transfer (NST) technology. This repository contains the **web application** built with React, providing an intuitive interface for creating, sharing, and managing AI-generated artwork.

### Key Highlights

- 🎨 **Three Generation Modes**: Basic, Segmentation, and Mixed style transfer
- 🖼️ **Open Style System**: Users can upload and share custom artistic styles from their favorite paintings
- 👥 **Community Gallery**: Browse and interact with artwork created by other users
- 🔥 **Real-time Updates**: Live gallery updates powered by Firebase Firestore
- ⚙️ **Advanced Controls**: Fine-tune style weight, TV weight, iterations, and initialization methods
- 📱 **Responsive Design**: Optimized for desktop and mobile viewing



## ✨ Features

### 🎨 Generation Modes

#### 1. **Basic Style Transfer**
Apply a single artistic style uniformly across your entire image.
- Select from curated or user-uploaded styles
- Adjustable style intensity (1-100,000)
- Configurable total variation weight for smoothness
- Custom iteration count (100-10,000)
- Multiple initialization methods (random, content, style)

#### 2. **Segmentation-Based Transfer**
Apply different styles to people and backgrounds independently.
- Automatic person detection and segmentation
- Separate style controls for foreground (person) and background
- Enable/disable individual style layers
- Perfect for portrait enhancement

#### 3. **Mixed Style Transfer**
Blend two artistic styles together on a single image.
- Combine two different styles with adjustable mixing ratio (alpha)
- Create unique hybrid artistic effects
- Full control over blend composition

### 🖼️ Gallery & Social Features

- **Masonry Layout**: Pinterest-style responsive grid showcasing community artwork
- **User Profiles**: View generation history and statistics for each user
- **Image Details**: Inspect generation parameters, styles used, and metadata
- **Download & Share**: Save high-quality stylized images locally
- **Style Library**: Add community styles to your personal collection
- **Real-time Sync**: Instant updates as new artwork is generated

### 🔐 Authentication & Security

- Email/password authentication with Firebase Auth
- Email verification requirement
- Protected routes for authenticated users only
- User-specific style libraries and generation history

### 🎛️ Advanced Configuration

- **Style Weight**: 1 to 100,000 (logarithmic scale)
- **TV Weight**: 1 to 100,000 for noise reduction
- **Iterations**: 100 to 10,000 optimization steps
- **Initialization**: Random, content-based, or style-based starting points
- **Alpha Blending**: 0.0-1.0 for mixed style generation



## 🚀 Demo


### Generation Workflow

1. **Login/Register** with email verification
2. **Browse Gallery** to view community artwork and inspiration
3. **Click "Generate"** to open the generation drawer
4. **Select Mode**: Choose Basic, Segmentation, or Mixed
5. **Upload Content**: Select your photo to stylize
6. **Choose Style(s)**: Pick from curated or custom styles
7. **Adjust Parameters**: Fine-tune style weight, iterations, etc.
8. **Generate**: Submit and watch the magic happen in real-time
9. **Share**: Your artwork appears instantly in the community gallery



## 🛠️ Tech Stack

### Frontend
- **React** 19.1.0 - Modern UI with hooks and functional components
- **React Router DOM** 7.6.2 - Client-side routing
- **TailwindCSS** 3.4.1 - Utility-first styling
- **Radix UI** - Accessible component primitives (Dialog, Drawer, Slider, Tabs, Avatar)
- **Framer Motion** 12.17.0 - Smooth animations and transitions
- **Lucide React** 0.513.0 - Beautiful icon library

### Backend & Database
- **Firebase Authentication** 11.9.0 - Secure user management
- **Cloud Firestore** 11.9.0 - NoSQL real-time database
- **Python Backend** (separate repository) - Neural Style Transfer engine

### UI/UX Libraries
- **react-photo-album** 3.1.0 - Masonry gallery layout
- **yet-another-react-lightbox** 3.23.2 - Image viewer
- **Vaul** 1.1.2 - Drawer component
- **Sonner** 2.0.5 - Toast notifications
- **Class Variance Authority** - Component variant management

### Development Tools
- **React Scripts** 5.0.1 - CRA build configuration
- **PostCSS** & **Autoprefixer** - CSS processing
- **ESLint** - Code quality



## 📋 Prerequisites

Before setting up the project, ensure you have:

- **Node.js** >= 16.x (LTS recommended)
- **npm** >= 8.x or **yarn** >= 1.22.x
- **Firebase Project** with:
  - Authentication enabled (Email/Password provider)
  - Firestore database
  - Proper security rules configured
- **Backend API** running (Neural Style Transfer service)
- **Git** for version control



## 🔧 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/style-web.git
cd style-web
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Backend API URL (your Neural Style Transfer server)
REACT_APP_BACKEND_URL=http://localhost:5000

# Firebase Configuration (optional - already in firebase.js)
# REACT_APP_FIREBASE_API_KEY=your_api_key
# REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
# REACT_APP_FIREBASE_PROJECT_ID=your_project_id
# REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
# REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
# REACT_APP_FIREBASE_APP_ID=your_app_id
# REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

> **⚠️ Security Note**: The current `firebase.js` contains hardcoded credentials. For production, move these to environment variables and add `.env` to `.gitignore`.

### 4. Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Email/Password** authentication
3. Create a **Firestore database** with the following structure:

```
firestore/
├── users/
│   └── {userId}/
│       ├── name: string
│       ├── email: string
│       └── styles/ (subcollection)
│           └── {styleId}/
│               ├── name: string
│               ├── image: string (URL)
│               └── timestamp: timestamp
├── gens/
│   └── {generationId}/
│       ├── userId: string
│       ├── username: string
│       ├── contentImage: string (URL)
│       ├── outputImage: string (URL)
│       ├── style: object (for basic)
│       ├── personStyle: object (for segmentation)
│       ├── backgroundStyle: object (for segmentation)
│       ├── style1: object (for mixed)
│       ├── style2: object (for mixed)
│       ├── generationType: string ("basic" | "segmentation" | "mixed")
│       ├── styleWeight: number
│       ├── tvWeight: number
│       ├── iterations: number
│       ├── initMethod: string
│       └── timestamp: timestamp
└── styles/
    └── {styleId}/
        ├── name: string
        ├── image: string (URL)
        ├── artist: string (optional)
        └── timestamp: timestamp
```

4. Configure **Firestore Security Rules**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
      
      // User styles subcollection
      match /styles/{styleId} {
        allow read: if request.auth != null;
        allow write: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    // Public styles
    match /styles/{styleId} {
      allow read: if request.auth != null;
      allow write: if false; // Only admins via backend
    }
    
    // Generations
    match /gens/{genId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

### 5. Backend API Setup

This web app requires a separate Python backend for Neural Style Transfer. Ensure the backend is running and accessible at the URL specified in `REACT_APP_BACKEND_URL`.

**Required Backend Endpoints:**
- `POST /content/upload/` - Upload content image
- `POST /generate` - Basic style transfer
- `POST /generate_seg` - Segmentation-based transfer
- `POST /generate_mixed` - Mixed style transfer
- `GET /image/style/{filename}` - Serve style images
- `GET /image/content/{filename}` - Serve content images
- `GET /image/generated/{filename}` - Serve generated images



## 🚀 Usage

### Development Server

Start the development server:

```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

### Production Build

Create an optimized production build:

```bash
npm run build
```

The build artifacts will be stored in the `build/` directory.

### Run Tests

```bash
npm test
```

### Deployment

Deploy the `build/` folder to your preferred hosting service:
- **Firebase Hosting**: `firebase deploy --only hosting`
- **Vercel**: `vercel deploy`
- **Netlify**: Drag and drop `build/` folder
- **AWS S3 + CloudFront**: Upload to S3 bucket



## 📁 Project Structure

```
style-web/
├── public/
│   ├── index.html              # HTML template
│   ├── manifest.json           # PWA manifest
│   ├── logo.png               # App logo
│   └── robots.txt             # SEO robots file
├── src/
│   ├── components/
│   │   ├── ui/                # Radix UI components
│   │   │   ├── alert-dialog.jsx
│   │   │   ├── alert.jsx
│   │   │   ├── avatar.jsx
│   │   │   ├── button.jsx
│   │   │   ├── card.jsx
│   │   │   ├── dialog.jsx
│   │   │   ├── drawer.jsx
│   │   │   ├── slider.jsx
│   │   │   └── tabs.jsx
│   │   ├── GenerateDrawer.jsx  # Main generation interface
│   │   ├── Image.jsx          # Image display & actions
│   │   ├── ImageCarousel.jsx  # Style selector carousel
│   │   ├── Navbar.jsx         # Navigation bar
│   │   ├── ProtectedRoute.jsx # Auth route wrapper
│   │   └── UserProfile.jsx    # User profile panel
│   ├── lib/
│   │   └── utils.js           # Utility functions (cn, etc.)
│   ├── pages/
│   │   ├── Gallery.jsx        # Main gallery view
│   │   ├── Login.jsx          # Login page
│   │   └── Register.jsx       # Registration page
│   ├── App.css                # Global styles
│   ├── App.jsx                # Main app component
│   ├── firebase.js            # Firebase configuration
│   ├── index.css              # Tailwind imports
│   ├── index.js               # React entry point
│   └── reportWebVitals.js     # Performance monitoring
├── .gitignore
├── components.json            # shadcn/ui configuration
├── package.json               # Dependencies & scripts
├── tailwind.config.js         # Tailwind configuration
└── README.md                  # This file
```



## 🎨 Key Components

### GenerateDrawer
The heart of the application - handles all three generation modes with advanced parameter controls.

**Props**: None (uses internal state and Firebase)

**Features**:
- Tab-based interface for Basic/Segmentation/Mixed modes
- Image upload with preview
- Style carousel with user + curated styles
- Real-time parameter adjustment
- Async generation with loading states

### Gallery
Masonry-style responsive gallery with user profile sidebar.

**Props**: None

**Features**:
- Real-time Firestore sync
- Responsive masonry layout (4 columns on desktop)
- Click to view full details in dialog
- User profile side panel
- Smooth animations

### ImageDialog
Full-screen image viewer with metadata and actions.

**Features**:
- Display all generation parameters
- Show used styles (with artist info)
- Download original quality
- Delete own generations
- Add community styles to personal library
- View user profiles



## 🔐 Authentication Flow

```
1. User visits app → Redirected to /login
2. User registers → Email verification sent
3. User verifies email via link
4. User logs in → Redirected to /gallery
5. Protected routes check auth.currentUser
6. Logout → Clear session → Return to /login
```



## 🎨 Style System

### Style Object Structure

```javascript
{
  name: "Starry Night",
  artist: "Vincent van Gogh",
  image: "https://backend-url.com/image/style/starry-night.jpg",
  given: true, // false for user-uploaded styles
  timestamp: Firestore.Timestamp,
  documentId: "style123"
}
```

### Adding Custom Styles

Users can add styles from two sources:
1. **Community Gallery**: Click "Add to My Styles" on any generation
2. **Upload New**: (Feature not yet implemented in this version)



## 🧪 Neural Style Transfer Parameters

### Style Weight
- **Range**: 1 to 100,000 (logarithmic scale)
- **Effect**: Controls how strongly the artistic style is applied
- **Recommendation**: 
  - Light: 100-1,000 (subtle texture)
  - Medium: 3,000-10,000 (balanced)
  - Heavy: 30,000-100,000 (strong artistic effect)

### TV Weight (Total Variation)
- **Range**: 1 to 100,000
- **Effect**: Reduces noise and promotes smoothness
- **Recommendation**: 
  - Low: 1-100 (preserve detail, more noise)
  - Medium: 1,000-10,000 (balanced)
  - High: 10,000-100,000 (very smooth, less detail)

### Iterations
- **Range**: 100 to 10,000
- **Effect**: Number of optimization steps
- **Recommendation**:
  - Quick: 100-500 (fast preview)
  - Standard: 500-1,000 (good quality)
  - High-quality: 2,000-10,000 (best results, slower)

### Initialization Method
- **random**: Start with random noise (more creative)
- **content**: Start with content image (preserves structure)
- **style**: Start with style image (experimental)

### Alpha (Mixed Mode Only)
- **Range**: 0.0 to 1.0
- **Effect**: Blending ratio between style1 and style2
- **0.0**: Pure style1
- **0.5**: Equal mix
- **1.0**: Pure style2



## 📊 Database Schema

### Collections

#### `users`
Stores user profile information.

```javascript
{
  uid: string (document ID),
  name: string,
  email: string,
  createdAt: timestamp
}
```

**Subcollection**: `users/{uid}/styles`
```javascript
{
  name: string,
  image: string (URL),
  artist: string (optional),
  timestamp: timestamp
}
```

#### `styles`
Global curated style library (read-only for users).

```javascript
{
  name: string,
  artist: string,
  image: string (URL),
  timestamp: timestamp,
  featured: boolean (optional)
}
```

#### `gens`
All generated images with metadata.

```javascript
{
  userId: string,
  username: string,
  generationType: "basic" | "segmentation" | "mixed",
  contentImage: string (URL),
  outputImage: string (URL),
  
  // Basic mode
  style: object,
  
  // Segmentation mode
  personStyle: object,
  backgroundStyle: object,
  segPersonStyleEnabled: boolean,
  segBackgroundStyleEnabled: boolean,
  personStyleWeight: number,
  backgroundStyleWeight: number,
  
  // Mixed mode
  style1: object,
  style2: object,
  alpha: number,
  
  // Common parameters
  styleWeight: number,
  tvWeight: number,
  iterations: number,
  initMethod: string,
  timestamp: timestamp
}
```



## 🔧 Configuration

### Tailwind Config
Custom animations and color schemes are defined in `tailwind.config.js`:
- Overlay animations (show/hide)
- Content animations (slide-in/slide-out)
- Custom color variables

### shadcn/ui Config
Component configuration in `components.json`:
- Style: New York
- Base color: Neutral
- CSS variables: Enabled
- Path aliases configured



## 🤝 Contributing

Contributions are welcome! This project was developed as part of academic research, and we're excited to see it grow.

### How to Contribute

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add some amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Contribution Ideas

- [ ] Add upload custom style feature
- [ ] Implement user favorites/likes system
- [ ] Add social sharing (Twitter, Facebook)
- [ ] Create style recommendation engine
- [ ] Add batch processing for multiple images
- [ ] Implement progress tracking for generations
- [ ] Add image filters and pre-processing options
- [ ] Create mobile app (React Native or Flutter)
- [ ] Add admin dashboard for style moderation
- [ ] Implement payment system for premium styles



## 🐛 Known Issues & Limitations

- **Firebase credentials exposed**: Move to environment variables in production
- **No upload custom style UI**: Backend supports it, frontend needs implementation
- **Large images**: May timeout or fail on slow connections
- **Browser compatibility**: Best on Chrome/Edge (Chromium-based)
- **Mobile experience**: Functional but optimized for desktop


## 👨‍💻 Author

**Babos Dávid**
- GitHub: [@FokaKefir](https://github.com/FokaKefir)
- Email: babosdavid8@gmail.com
- LinkedIn: [Babos Dávid](https://www.linkedin.com/in/babos-d%C3%A1vid-ba9bb5227/)



## 🙏 Acknowledgments

- **Accenture**: For the special award and recognition
- **Neural Style Transfer Research**: Original paper by Gatys et al. (2015)
- **Open Source Community**: For the amazing libraries and tools
- **Firebase**: For the robust backend infrastructure
- **shadcn/ui**: For the beautiful accessible components
- **Tailwind Labs**: For the utility-first CSS framework



## 📚 Research & References

### Publications
- Gatys, L. A., Ecker, A. S., & Bethge, M. (2015). *A Neural Algorithm of Artistic Style*. arXiv:1508.06576

### Related Projects
- Android version: [StyleApp](https://github.com/FokaKefir/StyleApp)
- Backend API: [NeuralStyleTransfer](https://github.com/FokaKefir/NeuralStyleTransfer)

### Conference Presentations
- **2024 Scientific Student Conference** - 1st Place Winner
- **2025 National Scientific Student Conference** - Presenter

