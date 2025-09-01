# Agricultural Supply Chain Blockchain

A blockchain-based agricultural supply chain management system built with Hyperledger Fabric, Node.js, and React.

## Overview

This project provides a complete solution for tracking agricultural products through the supply chain, from farm to consumer, using blockchain technology for transparency and traceability.

## Architecture

- **Backend API** (`/application`): Node.js/Express server with Hyperledger Fabric integration
- **Smart Contract** (`/chaincode`): Hyperledger Fabric chaincode for agricultural supply chain logic
- **Frontend** (`/frontend/plancana-nextjs`): Next.js application with TypeScript and Tailwind CSS for user interface
- **Database**: PostgreSQL with Prisma ORM
- **Blockchain**: Hyperledger Fabric network

## Prerequisites

- Node.js (v14+)
- Docker and Docker Compose
- PostgreSQL
- Hyperledger Fabric (fabric-samples)

## Quick Start

### 1. Start the Blockchain Network

```bash
cd application
npm run blockchain:start
npm run blockchain:deploy
```

### 2. Setup Database

```bash
cd application
npm install
npm run db:migrate
npm run db:seed
```

### 3. Start the API Server

```bash
cd application
npm start
# or for development
npm run dev
```

### 4. Start the Frontend

```bash
cd frontend/plancana-nextjs
npm install
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- API: http://localhost:3001

## Features

- User authentication and authorization
- Batch registration and management
- QR code generation and verification
- Supply chain tracking
- Role-based dashboards (Farmer, Processor, Admin)
- Profile management
- Blockchain integration for immutable records

## API Documentation

See `/docs/API.md` for detailed API documentation.

## Database Scripts

- `npm run db:migrate` - Run database migrations
- `npm run db:generate` - Generate Prisma client
- `npm run db:seed` - Seed database with initial data
- `npm run db:reset` - Reset and reseed database
- `npm run db:studio` - Open Prisma Studio

## Blockchain Scripts

- `npm run blockchain:start` - Start Hyperledger Fabric network
- `npm run blockchain:deploy` - Deploy chaincode
- `npm run blockchain:stop` - Stop Hyperledger Fabric network

## Development

The project uses:
- **Backend**: Express.js, Prisma ORM, Hyperledger Fabric SDK
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS 4, Chart.js, React Hook Form
- **Authentication**: JWT tokens with bcryptjs
- **File Upload**: Multer for profile images and documents
- **QR Codes**: qrcode library for generation, qr-scanner for reading

## License

This project is licensed under the MIT License.