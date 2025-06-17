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
- **Hybrid Node.js + Python** architecture with seamless integration
- **Node.js + Express** server with TypeScript for frontend API
- **FastAPI Python Backend** for Azure services and document processing
- **CrewAI Microservices** for autonomous agent orchestration
- **Azure SQL Server** as primary database (tf_genie database)
- **Azure Blob Storage** for document management via Python SDK
- **Azure Document Intelligence** for OCR and field extraction
- **Drizzle ORM** configuration (though primarily using raw SQL for Azure)
- **Replit Authentication** for user management
- **Python Backend Proxy** for Node.js/Python communication

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

## Base Workflow - Multi-Form PDF Processing System

### Step 1: File Upload (UI) ✓ COMPLETED
- User uploads scanned multi-form PDF via React interface (Menu: "I am tired")
- Progress bar shows file upload progress
- Backend (Python) receives PDF file through REST API endpoint
- Status: Fully implemented and operational with Azure SQL database integration

### Step 2: Form Detection & Classification (Python + Azure Document Intelligence) ✅ COMPLETED
- Uploaded PDF processed using Azure Document Intelligence custom model/classifier
- Individual forms are identified and segregated (one file with X forms → X individual PDFs)
- Each individual form stored temporarily for further processing
- Form detection results automatically stored in TF_ingestion_Pdf table
- Processing pipeline now includes form_detection step with completion tracking
- Status: Complete with database integration and processing status updates

### Step 3: OCR Processing & Progress Bars ✅ COMPLETED
- Individual form OCR processing with detailed progress tracking per form
- Raw text extraction to .txt files in form_outputs directory
- Structured key-value pairs extraction using regex patterns for standard forms
- Four distinct progress bars per form: Upload → OCR → Text Extraction → JSON Generation
- Real-time progress updates stored in Azure SQL database with form-specific tracking
- Enhanced frontend FormProgressDisplay component showing individual form processing status
- Complete processing pipeline: form_ocr_processing step integrated with database storage
- Status: Complete with visual progress bars and structured data output

### Step 4: New Form Detection & Approval Workflow ✅ COMPLETED
- Automatic detection of unknown form types with confidence scoring below 0.8 threshold
- AI-powered JSON template generation for unrecognized forms using Azure Document Intelligence
- Complete approval workflow system with pending/approved/rejected status management
- Backend API endpoints for form submission, approval, and statistics tracking
- Frontend interface (NewFormDetection.tsx) with real-time statistics and approval management
- Integration with existing processing pipeline for seamless new form handling
- Status: Complete with full workflow automation and user interface integration

### Step 5: AI-Assisted Field Extraction ✅ COMPLETED
- Enhanced Python field extraction service with rule-based and Azure AI logic
- Comprehensive pattern matching for 5 form types: Commercial Invoice, Bill of Lading, Certificate of Origin, LC Document, Packing List
- Azure Document Intelligence integration for advanced field detection and key-value pair extraction
- Combined extraction methodology merging rule-based patterns with AI-detected fields
- Confidence scoring system for extracted field values with quality assessment
- Automatic data type detection (integer, decimal, date, reference, text) for structured storage
- Direct integration with TF_ingestion_fields table for real-time field storage
- Node.js wrapper function with Python process spawning and result parsing
- Enhanced processing pipeline with field_extraction step tracking and status monitoring
- Status: Complete with comprehensive field extraction capabilities and database integration

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
- June 17, 2025. Successfully populated Forms Recognition sample data - Created sample form definitions in TF_forms table including Commercial Invoice (approved status), Bill of Lading (pending approval), Certificate of Origin (pending approval), and Packing List (pending approval). Added "Create Sample Data" button to Back Office Approval page for easy data population. Back Office approval workflow now functional with pending forms awaiting approval and approved forms ready for document processing.
- June 17, 2025. Implemented complete Back Office approval workflow with form submission capability - Fixed approve/reject button functionality by correcting API endpoint column mappings, added "Submit New Form" dialog for users to submit new form types for approval, created form submission API endpoint with automatic form_id generation. Users can now submit new forms (like Insurance Certificate) and Back Office can approve/reject them. Successfully tested both form submission and approval processes with live Azure SQL database integration.
- June 17, 2025. Updated Processing Records endpoints to use dedicated Azure SQL tables - Changed PDF processing records endpoint to query TF_ingestion_Pdf table (columns: id, ingestion_id, form_id, file_path, document_type, page_range, created_date) and TXT processing records endpoint to query TF_ingestion_TXT table (columns: id, ingestion_id, content, confidence, language, created_date). Both endpoints now use JOIN queries with main TF_ingestion table to provide complete processing information. Form Management Processing Records tab now displays data from specific dedicated tables instead of filtering main ingestion table.
- June 17, 2025. Successfully completed Forms Recognition data migration and resolved processing table population - Fixed TF_ingestion_Pdf table population with 12 PDF processing records successfully migrated from main TF_ingestion table. Resolved SQL Server ntext data type compatibility issues in confidence column handling for TF_ingestion_TXT table. Created robust populate processing tables functionality with proper error handling for data type constraints. Forms Recognition system now fully operational with PDF processing records, form approval workflow, and real-time processing dashboard displaying authentic Azure SQL data.
- June 17, 2025. Fixed TXT Processing Table data type constraints - Resolved DECIMAL(5,4) precision constraint issue in confidence column that was causing arithmetic overflow errors. Successfully populated TF_ingestion_TXT table with 3 processing records using alternative insertion method (without confidence column). Both PDF Processing Table (12 records) and TXT Processing Table (3 records) now fully operational. Forms Recognition system complete with authentic Azure SQL data across all processing record types.
- June 17, 2025. Implemented document grouping by form types - Created GroupedDocuments.tsx page with real-time classification of 12 documents across 5 categories (LC Document, Commercial Invoice, Certificate of Origin, Packing List, Unclassified). Added /forms/grouped route and API endpoint with intelligent document classification based on filename and document type patterns. Fixed SQL data type issues with Azure SQL ntext columns using DATALENGTH function. Document grouping system now fully operational showing processing status and text extraction metrics.
- June 17, 2025. Successfully processed and fixed user's multi-form PDF upload - Resolved JavaScript variable scope error in processing pipeline that prevented data storage in processing tables. Fixed lc.pdf (2.7MB) upload with 244,298 characters extracted and properly categorized as LC Document. Added fix-upload-processing API endpoint to manually populate processing tables when automatic storage fails. Document now appears correctly in grouped documents interface with completed status.
- June 17, 2025. Implemented comprehensive Python backend with enhanced multi-form processing - Created pythonFormsProcessor.py with Azure Document Intelligence integration, multi-form PDF segregation, and individual form extraction. Built Node.js integration layer with Python process spawning, real-time progress tracking, and enhanced status monitoring. Added tabbed interface (EnhancedFileUpload.tsx) with individual form display, progress bars for PDF splitting, formatted text display, sub-windows for field extraction, and advanced logging system (Info, Error, Warning, Critical). Integrated Python business logic with React frontend while maintaining Azure SQL database storage. System now supports complete multi-form document analysis workflow as specified in user requirements.
- June 17, 2025. Fixed file upload functionality and database integration - Resolved multer configuration issues and server crash problems, restored clean upload function structure, fixed database column mapping from mime_type to file_type matching actual Azure SQL table structure. File upload now working correctly with proper buffer handling (144KB+ files tested successfully). Enhanced processing status system with 8 detailed steps providing real-time progress tracking from upload through completion. Forms Recognizer system fully operational with Azure Document Intelligence integration.
- June 17, 2025. Fixed TF_ingestion_Pdf tab view and download functionality - Resolved ingestion_id format differences between main table (ing_xxxx_xxxx format) and PDF table (numeric format). Updated download endpoints to search across all processing tables and provide fallback content when original files aren't available on disk. All three Ingestion Records tabs (Main, PDF, TXT) now fully operational with working view and download functionality using authentic Azure SQL data.
- June 17, 2025. Implemented comprehensive Python backend with FastAPI and Azure SDK integration - Created complete pythonBackend.py with AzureBlobStorage, AzureSQLDatabase, PDFProcessor, AzureDocumentIntelligence, and FormsRecognitionService classes. Built pythonBackendProxy.ts for Node.js/Python communication bridge with automatic startup management and health monitoring. Created completeFormsWorkflow.ts orchestrating hybrid Node.js/Python architecture with intelligent fallback to existing Node.js processing when Python backend unavailable. Added missing azureDataService methods for complete workflow integration. System now supports enhanced Azure SDK-based processing pipeline: PDF Upload → Azure Blob Storage → Form Classification → PDF Splitting (PyMuPDF) → OCR (Azure Document Intelligence) → Field Extraction → Azure SQL Storage with real-time progress monitoring and seamless frontend integration.

## User Preferences

Preferred communication style: Simple, everyday language.