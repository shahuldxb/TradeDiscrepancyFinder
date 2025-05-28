# LC Document Discrepancy Detection System Architecture

## 1. System Overview

The LC Document Discrepancy Detection System is designed to identify discrepancies between Letter of Credit (LC) documents, SWIFT MT messages, and a master reference document. The system leverages CrewAI agents for orchestration, supports multiple document input formats, and provides detailed discrepancy reports with references to UCP 600 rules and SWIFT MT standards.

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                        LC Discrepancy Detection System                   │
│                                                                         │
├─────────────┬─────────────────┬────────────────────┬───────────────────┤
│             │                 │                    │                   │
│  Document   │    CrewAI       │   Discrepancy      │    Frontend       │
│  Processing │    Agents       │   Detection        │    Interface      │
│  Pipeline   │    Orchestration│   Engine           │                   │
│             │                 │                    │                   │
└─────┬───────┴────────┬────────┴──────────┬─────────┴─────────┬─────────┘
      │                │                   │                   │
      │                │                   │                   │
┌─────▼──────┐  ┌──────▼──────┐    ┌──────▼─────────┐  ┌──────▼─────────┐
│            │  │             │    │                │  │                │
│ Document   │  │ Agent       │    │ Rules          │  │ User           │
│ Repository │  │ Coordination│    │ Repository     │  │ Interface      │
│            │  │             │    │                │  │                │
└────────────┘  └─────────────┘    └────────────────┘  └────────────────┘
```

## 3. Core Components

### 3.1 Document Processing Pipeline

Responsible for ingesting, parsing, and normalizing various document formats:

- **Document Ingestion Module**
  - Supports multiple input formats (PDF, OCR, text)
  - Handles SWIFT MT message parsing
  - Processes LC documents (Commercial Invoice, B/L, etc.)
  - Manages master document reference

- **Document Parser Module**
  - MT Message Parser (MT700, MT710, etc.)
  - LC Document Parser (structured extraction)
  - OCR Processing for scanned documents
  - Text extraction from PDFs

- **Document Normalization Module**
  - Standardizes extracted data
  - Maps fields across document types
  - Prepares data for comparison

### 3.2 CrewAI Agents Orchestration

Coordinates specialized agents for different aspects of discrepancy detection:

- **Agent Manager**
  - Orchestrates agent workflow
  - Manages agent communication
  - Handles task distribution

- **Specialized Agents**
  - **Document Intake Agent**: Handles document reception and classification
  - **MT Message Agent**: Specializes in SWIFT MT message analysis
  - **LC Document Agent**: Focuses on LC document validation
  - **Comparison Agent**: Performs cross-document comparison
  - **UCP Rules Agent**: Applies UCP 600 rules to findings
  - **Reporting Agent**: Generates comprehensive reports

### 3.3 Discrepancy Detection Engine

Core logic for identifying discrepancies across documents:

- **Field Validation Module**
  - Mandatory field validation
  - Field format validation
  - Field content validation
  - Context-aware validation

- **Cross-Document Comparison Module**
  - MT-to-LC document comparison
  - Document-to-master comparison
  - Multi-document consistency checking

- **Rules Application Module**
  - UCP 600 rules application
  - SWIFT MT standards validation
  - Banking practice compliance

- **Discrepancy Classification Module**
  - Categorizes discrepancies by type
  - Assigns severity levels
  - Provides rule references
  - Generates explanations

### 3.4 Frontend Interface

User-facing components for interaction with the system:

- **Dashboard**
  - Overview of processed documents
  - Summary of detected discrepancies
  - Status tracking

- **Document Management**
  - Document upload interface
  - Document viewing and annotation
  - Document history

- **Discrepancy Review**
  - Detailed discrepancy reports
  - UCP/SWIFT rule references
  - Explanation of findings
  - Discrepancy resolution workflow

- **Administration**
  - User management
  - System configuration
  - Rules management

## 4. Data Flow

1. **Document Intake**
   - User uploads LC documents, MT messages, and master reference
   - System classifies and routes documents to appropriate parsers

2. **Document Processing**
   - Documents are parsed and normalized
   - Structured data is extracted and stored
   - Field mapping is performed

3. **Discrepancy Detection**
   - Mandatory field validation
   - Context-aware field validation
   - Cross-document comparison
   - Qualitative and quantitative analysis

4. **Rules Application**
   - UCP 600 rules are applied to findings
   - SWIFT MT standards are checked
   - Banking practice compliance is verified

5. **Reporting**
   - Discrepancies are categorized and explained
   - References to relevant rules are provided
   - Comprehensive report is generated

6. **Integration**
   - Discrepancy findings trigger external method calls
   - Results are available for audit and operational review

## 5. Technical Stack

### 5.1 Frontend
- **Framework**: React.js
- **State Management**: Redux
- **UI Components**: Material-UI
- **API Communication**: Axios

### 5.2 Backend
- **Runtime**: Node.js
- **API Framework**: Express.js
- **Database**: MongoDB (document storage)
- **Authentication**: JWT

### 5.3 Document Processing
- **OCR Engine**: Tesseract.js
- **PDF Processing**: pdf.js
- **Text Processing**: Natural Language Processing libraries
- **Image Processing**: Sharp

### 5.4 Agent Framework
- **CrewAI**: For agent orchestration and task management
- **LangChain**: For advanced NLP capabilities

## 6. Field Validation Framework

### 6.1 Field Types
- **Mandatory Fields**: Required by UCP/SWIFT standards
- **Conditional Fields**: Required based on context
- **Optional Fields**: Not required but validated if present

### 6.2 Validation Dimensions
- **Presence**: Field exists when required
- **Format**: Field follows required format
- **Content**: Field contains valid data
- **Context**: Field is valid in document context
- **Consistency**: Field is consistent across documents

### 6.3 Qualitative vs. Quantitative Validation
- **Quantitative**: Numeric values, dates, amounts, quantities
- **Qualitative**: Descriptions, names, references, clauses

## 7. Integration Points

### 7.1 External System Integration
- REST API for third-party system integration
- Webhook support for event-driven architecture
- Method calls after discrepancy detection

### 7.2 Export Capabilities
- PDF report generation
- Excel export for discrepancy lists
- JSON API responses

## 8. Security Considerations

- Role-based access control
- Document encryption
- Audit logging
- Secure API authentication
- Data retention policies

## 9. Scalability Considerations

- Microservices architecture for component scaling
- Document processing queue for high volume
- Caching for frequently accessed rules and references
- Horizontal scaling for agent processing

## 10. Future Expansion

- Machine learning for discrepancy prediction
- Advanced pattern recognition
- Historical discrepancy analysis
- Automated resolution suggestions
