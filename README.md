# AHA Spay/Neuter Clinic Management System

A comprehensive web application for managing veterinary clinic operations, including client management, animal records, medical history, invoicing, and document management.

## Features

- **Client Management**: Add, edit, and manage client information with blacklist functionality
- **Animal Records**: Track animal information, medical history, and procedures
- **Invoice Management**: Create, edit, and print invoices with PDF generation
- **Organization Management**: Manage rescue organizations and their animals
- **Document Management**: Handle PDF documents with editing capabilities
- **User Authentication**: Secure login system with role-based access

## Technology Stack

### Frontend

- **React 19** with TypeScript
- **Material-UI (MUI)** for UI components
- **React Router** for navigation
- **React Hook Form** with Yup validation
- **PDF-lib** for PDF generation and manipulation
- **Fabric.js** for PDF annotation
- **Axios** for API communication

### Backend

- **Node.js** with Express
- **MongoDB** with Mongoose
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Express Validator** for input validation

## Getting Started

### Prerequisites

- Node.js 18 or higher
- MongoDB 4.4 or higher
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd ahaClinic
   ```

2. **Install frontend dependencies**

   ```bash
   npm install
   ```

3. **Install backend dependencies**

   ```bash
   cd backend
   npm install
   cd ..
   ```

4. **Set up environment variables**

   Create a `.env` file in the `backend` directory:

   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/ahaclinic
   JWT_SECRET=your-secret-key-here
   ```

5. **Start the development servers**

   **Backend** (from the backend directory):

   ```bash
   cd backend
   npm run dev
   ```

   **Frontend** (from the root directory):

   ```bash
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Initial Setup Scripts

After starting the application for the first time, you may want to run these setup scripts:

7. **Create initial users** (Optional)

   ```bash
   node scripts/setup-users.js
   ```

   This script creates default admin and test users for development. You can modify the script to customize the initial users.

8. **Test RBAC system** (Optional)

   ```bash
   node scripts/test-rbac.js
   ```

   This script verifies that the Role-Based Access Control (RBAC) system is working correctly.

> **Note**: Additional utility scripts are available in the `/scripts` directory. See `scripts/README.md` for detailed documentation of all available scripts.

## Project Structure

```
ahaClinic/
├── src/                    # Frontend source code
│   ├── components/         # Reusable React components
│   ├── pages/             # Main application pages
│   ├── contexts/          # React contexts
│   ├── utils/             # Utility functions
│   └── types/             # TypeScript type definitions
├── backend/               # Backend source code
│   ├── src/               # Express server source
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   └── middleware/        # Express middleware
├── public/                # Static files and PDF templates
├── scripts/               # Setup and utility scripts
└── docs/                  # Documentation
```
