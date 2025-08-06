# Material Management System - Frontend

A modern React/Next.js frontend for airline material and tool management.

## Features

- **User Authentication** - Role-based access control
- **Material Management** - Track consumable materials and inventory
- **Tool Management** - Manage returnable tools and equipment (no calibration tracking)
- **Request System** - Submit and approve material/tool requests
- **Dashboard** - Overview of system status and metrics
- **Responsive Design** - Works on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI components
- **State Management**: React Context API
- **API Communication**: Fetch API with custom service layer

## Getting Started

### Prerequisites

- Node.js 18+ 
- Your backend API running on `http://localhost:5000`

### Installation

1. Clone the repository
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Set up environment variables:
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`
   Update the API URL if needed.

4. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## API Integration

The frontend communicates with your backend API through the service layer in `lib/api.ts`. 

### Expected API Endpoints

Your backend should implement these endpoints:

- `POST /api/auth/login` - User authentication
- `GET /api/auth/me` - Get current user
- `GET /api/materials` - Get all materials
- `GET /api/tools` - Get all tools
- `POST /api/tools/:id/checkout` - Check out a tool
- `POST /api/tools/:id/checkin` - Check in a tool
- `GET /api/categories` - Get categories
- `GET /api/locations` - Get locations
- `GET /api/requests` - Get material requests
- And more...

## User Roles

- **Admin**: Full access to all features
- **Storekeeper**: Manage inventory, approve requests
- **Technician**: Submit requests, check out tools

## Development

\`\`\`bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
\`\`\`

## Project Structure

\`\`\`
├── app/                 # Next.js app directory
├── components/          # Reusable UI components
├── lib/                # Utilities and API services
├── public/             # Static assets
└── styles/             # Global styles
