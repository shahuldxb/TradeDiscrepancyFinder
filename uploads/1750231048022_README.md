# Trade Finance Discrepancy Resolution Platform

A cutting-edge Trade Finance Discrepancy Resolution Platform leveraging autonomous AI agents for intelligent document processing and dynamic workflow management.

## Core Technologies

- **CrewAI Microservices Architecture**
- **Azure SQL Server Enterprise Database**
- **Advanced SWIFT Message Parsing**
- **Drizzle ORM for Data Management**
- **Gemini AI Document Intelligence**
- **Autonomous Agent Decision Making**
- **Secure Authentication Framework**
- **TypeScript React Frontend**
- **Comprehensive Workflow Management System**

## Features

### SWIFT Message Processing
- **MT700** - Documentary Credit Issuance validation
- **MT701** - Documentary Credit Advice validation  
- **MT702** - Documentary Credit Amendment validation
- Complete MT700 lifecycle management
- Real-time validation against Azure database tables

### Document Management
- OCR/PDF document processing
- UCP 600 compliance validation
- Document workflow management
- Discrepancy detection and resolution

### Incoterms Management System
- Complete Incoterms 2020 implementation
- AI agent validation
- Trade finance instrument validation

### Autonomous AI Agents
- Document analysis agents
- Discrepancy detection agents
- Workflow orchestration
- Real-time decision making

## Prerequisites

- **Node.js** 18+ 
- **npm** or **yarn**
- **Azure SQL Database** (for production data)
- **PostgreSQL** (optional, for local development)

## Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd trade-finance-platform
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# Azure SQL Server Configuration (Required)
AZURE_SQL_SERVER=your-server-name.database.windows.net
AZURE_SQL_DATABASE=your-database-name
AZURE_SQL_USERNAME=your-username
AZURE_SQL_PASSWORD=your-password

# Local Development Settings
REPLIT_DOMAINS=localhost:5173,127.0.0.1:5173
REPL_ID=local-dev-repl
ISSUER_URL=https://replit.com/oidc
SESSION_SECRET=your-session-secret-key-here
NODE_ENV=development

# Optional: PostgreSQL (if using local PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
PGHOST=localhost
PGPORT=5432
PGUSER=user
PGPASSWORD=password
PGDATABASE=dbname

# Optional: OpenAI API Key
OPENAI_API_KEY=your-openai-api-key
```

### 4. Database Setup

The application connects to your Azure SQL Server database with the following tables:
- `swift.message_types`
- `swift.message_fields`
- `swift.message_instances`
- `swift.field_validation_rules`
- And 40+ additional tables for comprehensive trade finance operations

### 5. Run the Application

**Option A: Standard Development (Replit-style)**
```bash
npm run dev
```

**Option B: Local Development (Recommended)**
```bash
node start-local.js
```

The application will start on:
- **Full Application**: http://localhost:5000 (frontend + backend together)

**Important for Local Development:**
- The server runs on port 5000 and serves both frontend and backend
- All API requests go to the same port (no proxy needed)
- Authentication is automatically bypassed in local development mode

## Authentication

### Production (Replit)
Uses Replit OpenID Connect authentication with automatic user management.

### Local Development
Automatically detects local environment and bypasses authentication with a mock user:
- **User ID**: local-dev-user
- **Email**: dev@localhost.com
- **Name**: Local Developer

## API Endpoints

### SWIFT Message Validation
- `POST /api/swift/validate` - Validate SWIFT messages
- `GET /api/swift/statistics` - Get validation statistics
- `GET /api/swift/message-types-azure` - Get message types from Azure DB

### Document Management
- `GET /api/document-sets` - Fetch document sets
- `POST /api/document-sets` - Create document sets
- `POST /api/documents/upload` - Upload documents

### Agent Management
- `GET /api/agents/status` - Get agent status
- `GET /api/autonomous-agents/status` - Get autonomous agent status
- `GET /api/agent-tasks` - Get agent tasks

## Navigation Structure

### Main Navigation
- **Dashboard** - Overview and analytics
- **Document Library** - Document management
- **SWIFT Messages** - Message processing and validation
- **Trade Finance** - LC processing and validation
- **Incoterms** - Incoterms management system
- **AI Agents** - Agent configuration and monitoring
- **Validation Results** - Discrepancy analysis
- **Document Workflow** - Workflow management

### SWIFT Sub-Navigation
- **Message Details** - View message specifications
- **Message Validation** - Validate MT700/701/702 messages
- **Category 7 Messages** - Documentary credit messages
- **MT700 Lifecycle** - Complete LC lifecycle management

## Development

### File Structure
```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/        # Page components
│   │   └── lib/          # Utilities and configuration
├── server/                # Express backend
│   ├── routes.ts         # API routes
│   ├── swiftService.ts   # SWIFT validation logic
│   ├── azureDataService.ts # Azure database operations
│   └── autonomousAgents.ts # AI agent logic
├── shared/               # Shared types and schemas
└── uploads/             # File upload storage
```

### Key Features in Code

#### SWIFT Validation
The system validates SWIFT messages against your actual Azure database:
```typescript
// Validates MT700, MT701, MT702 messages
// Connects to swift.message_fields table
// Stores results in swift.message_instances
```

#### Autonomous Agents
AI agents that make independent decisions:
```typescript
// Document processing agent
// Discrepancy detection agent
// Workflow coordination agent
```

#### Authentication Bypass for Local Dev
Automatically detects environment:
```typescript
const isLocalDev = !process.env.REPLIT_DOMAINS || process.env.NODE_ENV === 'development';
```

## Troubleshooting

### Common Issues

1. **REPLIT_DOMAINS Error**
   - Solution: Set `NODE_ENV=development` in your `.env` file
   - The app will automatically use local development mode

2. **Database Connection Issues**
   - Verify Azure SQL credentials in `.env`
   - Ensure firewall allows your IP address
   - Check network connectivity

3. **Authentication Problems**
   - In local development, authentication is automatically bypassed
   - Verify `.env` file contains `NODE_ENV=development`

4. **Port Conflicts**
   - Default port is 5173
   - Change in `vite.config.ts` if needed

## Production Deployment

The application is designed for Replit deployment with:
- Automatic environment detection
- Replit authentication integration
- Azure SQL Server connectivity
- Secure session management

## Support

For technical support or questions about the trade finance platform, please refer to the comprehensive documentation included in the `attached_assets/` folder.