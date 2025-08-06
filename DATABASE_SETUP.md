# Prisma Database Setup Guide

## Prerequisites

### 1. Install PostgreSQL
Choose your operating system:

#### Windows:
1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Run the installer and follow the setup wizard
3. Remember the password you set for the `postgres` user
4. Default port is usually 5432

#### macOS:
\`\`\`bash
# Using Homebrew
brew install postgresql
brew services start postgresql

# Or download from https://www.postgresql.org/download/macosx/
\`\`\`

#### Linux (Ubuntu/Debian):
\`\`\`bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
\`\`\`

### 2. Verify Installation
\`\`\`bash
# Check if PostgreSQL is running
psql --version

# Connect to PostgreSQL (you'll be prompted for password)
psql -U postgres -h localhost
\`\`\`

## Database Setup

### 1. Create Database
Connect to PostgreSQL as the postgres user and run:

\`\`\`sql
-- Create database
CREATE DATABASE material_management;

-- Create a dedicated user (optional but recommended)
CREATE USER material_user WITH PASSWORD 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE material_management TO material_user;
\`\`\`

### 2. Environment Configuration
Create a `.env` file in your project root:

\`\`\`env
# Database Connection String
DATABASE_URL="postgresql://material_user:your_secure_password@localhost:5432/material_management?schema=public"

# Application Configuration
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000
NODE_ENV=development
\`\`\`

### 3. Install Dependencies
\`\`\`bash
npm install prisma @prisma/client bcryptjs @types/bcryptjs
npm install -D prisma
\`\`\`

### 4. Initialize Prisma
\`\`\`bash
npx prisma generate
\`\`\`

### 5. Apply Database Migrations
\`\`\`bash
npx prisma migrate dev --name init
\`\`\`

### 6. Seed the Database
\`\`\`bash
npx prisma db seed
\`\`\`

## Testing Connection

Run the health check:
\`\`\`bash
npm run dev
# Visit http://localhost:3000/api/health
