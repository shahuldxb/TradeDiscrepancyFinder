# Trade Finance Discrepancy Resolution Platform

## Overview

This is a sophisticated Trade Finance Discrepancy Resolution Platform that leverages autonomous AI agents for intelligent document processing and dynamic workflow management. The system is built around CrewAI microservices architecture with Azure SQL Server as the primary database, focusing on SWIFT message processing (MT700 series) and UCP 600 compliance validation.

## System Architecture

### Frontend Architecture
- **TypeScript React Frontend** with Vite build system
- **Shadcn/UI Components** for modern, accessible UI
- **TanStack Query** for efficient data fetching and caching
- **Tailwind CSS** for styling with custom design system
- **React Hook Form** with Zod validation for form handling

### Backend Architecture
- **Node.js + Express** server with TypeScript
- **CrewAI Microservices** for autonomous agent orchestration
- **Azure SQL Server** as primary database (tf_genie database)
- **Drizzle ORM** configuration (though primarily using raw SQL for Azure)
- **Replit Authentication** for user management
- **OpenAI/Gemini AI** integration for document intelligence

### Database Strategy
- **Primary Database**: Azure SQL Server (tf_genie) hosted on shahulmi.database.windows.net
- **Backup Configuration**: PostgreSQL support via Drizzle (for potential migration)
- **Multi-Schema Design**: Separate schemas for different data domains (swift, etc.)

## Key Components

### 1. SWIFT Message Processing System
- **MT700 Lifecycle Management**: Complete documentary credit processing
- **MT701/MT702 Support**: Credit advice and amendment validation
- **Field Validation Engine**: Real-time validation against Azure database tables
- **Message Type Registry**: Comprehensive SWIFT field definitions and rules

### 2. Document Management System
- **OCR Processing**: PDF and image document text extraction
- **Document Sets**: Grouped document processing with lifecycle tracking
- **File Upload/Storage**: Secure document handling with metadata
- **Discrepancy Detection**: AI-powered document analysis

### 3. Autonomous AI Agent Framework
- **Agent Task Management**: Queued task processing with status tracking
- **Custom Agent Creation**: User-defined agents with specific roles
- **CrewAI Integration**: Multi-agent collaboration for complex workflows
- **Agent Configuration**: Dynamic agent setup with customizable parameters

### 4. UCP 600 Compliance Engine
- **UCP Articles Database**: Complete UCP 600 rule repository
- **Validation Rules**: Automated compliance checking
- **Business Rules Engine**: Configurable validation logic
- **Discrepancy Resolution**: AI-assisted resolution workflows

### 5. Incoterms 2020 Management
- **Complete Incoterms Implementation**: All 11 terms with detailed specifications
- **Responsibility Matrix**: Seller/buyer obligation tracking
- **AI Agent Validation**: Automated Incoterms compliance checking
- **Trade Finance Integration**: Connection to LC processing

## Data Flow

1. **Document Upload** → OCR Processing → Text Extraction → Azure SQL Storage
2. **SWIFT Message Validation** → Field Rules Check → Database Validation → Result Storage
3. **Agent Task Creation** → Queue Management → Processing → Result Persistence
4. **Discrepancy Detection** → UCP Rules Application → Resolution Workflow → Status Update
5. **User Authentication** → Replit OIDC → Azure SQL Session Management

## External Dependencies

### Cloud Services
- **Azure SQL Server**: Primary database hosting
- **Replit Infrastructure**: Development and deployment platform
- **OpenAI API**: AI-powered document analysis (optional)
- **Google Gemini**: Alternative AI processing capability

### Key Libraries
- **mssql**: Azure SQL Server connectivity
- **@google/generative-ai**: Gemini AI integration
- **@radix-ui/***: UI component primitives
- **drizzle-orm**: Database ORM layer
- **@tanstack/react-query**: Data fetching and state management

### Development Tools
- **tsx**: TypeScript execution for development
- **esbuild**: Production build optimization
- **Vite**: Frontend development server and bundling

## Deployment Strategy

### Development Environment
- **Local Development**: Node.js with PostgreSQL fallback
- **Replit Development**: Direct Azure SQL connection
- **Hot Reload**: Vite dev server with tsx backend execution

### Production Environment
- **Replit Autoscale Deployment**: Automatic scaling based on demand
- **Port Configuration**: External port 80 mapping to internal port 5000
- **Build Process**: Vite frontend build + esbuild backend bundle
- **Environment Variables**: Azure credentials and API keys via .env

### Database Configuration
- **Primary**: Azure SQL Server with encrypted connections
- **Connection Pooling**: Optimized for concurrent access
- **Schema Management**: Multi-schema approach for data organization
- **Backup Strategy**: Drizzle ORM as potential migration path

## Changelog

- June 14, 2025. Initial setup
- June 14, 2025. Fixed Sub Documents navigation and API - Updated left sidebar with "Sub Documents" menu item, created comprehensive SubDocuments.tsx page with search/filter capabilities, fixed Azure SQL schema issues in azureDataService.ts getSubDocumentTypes method to properly fetch 192 sub-documents with correct column mappings
- June 17, 2025. Implemented comprehensive Forms Recognition system - Created 6 Azure SQL database tables (TF_ingestion, TF_ingestion_Pdf, TF_ingestion_TXT, TF_ingestion_fields, TF_forms, TF_Fields), built file upload interface with drag-drop support for PDF/PNG/JPEG/TXT, added multer middleware for proper file handling, created ingestion management dashboard with filtering and status tracking. System accessible through "I am tired" sidebar section.
- June 17, 2025. Fixed Forms Recognition download functionality - Resolved file path mismatch issues between database records and physical file storage, implemented extracted text file download instead of original PDF files, added proper OCR text and structured JSON data export with formatted text files for user analysis and review.
- June 17, 2025. Enhanced Processing Details and Results tabs - Replaced placeholder content with real data displays showing OCR processing metrics (character counts, processing methods, file sizes), document classification status, extraction timelines, and comprehensive results view with summary statistics, extracted text preview, and structured field data visualization.
- June 17, 2025. Fixed File Upload processing status tracking - Updated FileUpload.tsx to fetch real-time database status instead of using hardcoded processing steps, added auto-refresh every 2 seconds for live status updates, synchronized uploaded files with Azure SQL ingestion records to display correct completion status for validation, OCR, classification, and extraction phases.
- June 17, 2025. Implemented Results tab with real OCR data display - Replaced placeholder content in FileUpload.tsx Results tab with actual extracted text preview, processing statistics (character/word counts), download functionality for TXT files, copy-to-clipboard feature, and visual metric cards showing real OCR extraction results from Azure SQL database.
- June 17, 2025. Implemented Azure Document Intelligence forms classification system - Created comprehensive classification service using Azure Document Intelligence API for individual PDF and text file processing. Added document-specific field extraction for Commercial Invoices, Bills of Lading, Certificates of Origin, Packing Lists, and Bills of Exchange. Integrated automatic model selection, confidence scoring, and enhanced field extraction combining OCR text with Azure's structured data analysis. All results stored in Azure SQL database with real-time processing status updates.
- June 17, 2025. Created complete Forms Recognition database architecture with Back Office approval workflow - Built 5 new Azure SQL tables: TF_ingestion_Pdf (individual PDF processing), TF_ingestion_TXT (individual TXT processing), TF_ingestion_fields (field extraction results), TF_forms (form definitions with approval workflow), and TF_Fields (field definitions). Implemented Back Office approval requirement where new form instances must await approval before processing. Added comprehensive API endpoints for form management, approval workflow, and individual document processing records.
- June 17, 2025. Fixed duplicate file upload functionality across Forms Recognition menus - Consolidated navigation structure by renaming menu back to "I am tired" as requested, created dedicated Back Office Approval page for form type approval workflow, created dedicated Form Management page for approved form definitions and analytics, fixed routing structure to eliminate duplicate FileUpload components across different menu items. System now has four distinct functional areas: Document Processing (file upload with Azure AI), Processing Dashboard (ingestion status monitoring), Back Office Approval (form type approval workflow), and Form Management (approved form definitions and analytics).

## User Preferences

Preferred communication style: Simple, everyday language.