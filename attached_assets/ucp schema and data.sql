-- Consolidated SQL File for UCP Rule Engine
-- Compatible with existing MasterDocuments and swift.message_types tables
-- Includes DROP TABLE statements for safe recreation
-- CORRECTED: Fixed foreign key constraint violations in mapping tables
-- FIXED: Corrected syntax errors with JSON strings and quotes

-- =============================================
-- DROP EXISTING TABLES SECTION
-- =============================================

-- Drop dependent tables first (those with foreign keys)
IF OBJECT_ID('RuleExecutionHistory', 'U') IS NOT NULL
    DROP TABLE RuleExecutionHistory;

IF OBJECT_ID('RuleDiscrepancyMapping', 'U') IS NOT NULL
    DROP TABLE RuleDiscrepancyMapping;

IF OBJECT_ID('RuleMTMessageMapping', 'U') IS NOT NULL
    DROP TABLE RuleMTMessageMapping;

IF OBJECT_ID('RuleDocumentMapping', 'U') IS NOT NULL
    DROP TABLE RuleDocumentMapping;

IF OBJECT_ID('UCPRules', 'U') IS NOT NULL
    DROP TABLE UCPRules;

IF OBJECT_ID('DiscrepancyTypes', 'U') IS NOT NULL
    DROP TABLE DiscrepancyTypes;

IF OBJECT_ID('RuleCategories', 'U') IS NOT NULL
    DROP TABLE RuleCategories;

IF OBJECT_ID('UCP_Articles', 'U') IS NOT NULL
    DROP TABLE UCP_Articles;

-- =============================================
-- SCHEMA SECTION
-- =============================================

-- UCP Articles Table - Stores the core UCP 600 articles
CREATE TABLE UCP_Articles (
    ArticleID INT PRIMARY KEY,
    ArticleNumber VARCHAR(10) NOT NULL,
    Title NVARCHAR(255) NOT NULL,
    Description NVARCHAR(MAX) NOT NULL,
    IsActive BIT DEFAULT 1
);

-- Rule Categories Table - Organizes rules into logical categories
CREATE TABLE RuleCategories (
    CategoryID INT PRIMARY KEY,
    CategoryName NVARCHAR(100) NOT NULL,
    Description NVARCHAR(500) NULL,
    ParentCategoryID INT NULL,
    Priority INT DEFAULT 5, -- 1 highest, 10 lowest
    IsActive BIT DEFAULT 1,
    FOREIGN KEY (ParentCategoryID) REFERENCES RuleCategories(CategoryID)
);

-- UCP Rules Table - Stores individual rules derived from UCP articles
CREATE TABLE UCPRules (
    RuleID INT PRIMARY KEY,
    RuleCode VARCHAR(50) NOT NULL,
    ArticleID INT NOT NULL,
    CategoryID INT NULL,
    RuleText NVARCHAR(MAX) NOT NULL,
    ValidationLogic NVARCHAR(MAX) NULL, -- JSON format for validation logic
    Priority INT DEFAULT 5, -- 1 highest, 10 lowest
    IsActive BIT DEFAULT 1,
    CreatedDate DATETIME2 DEFAULT GETDATE(),
    ModifiedDate DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (ArticleID) REFERENCES UCP_Articles(ArticleID),
    FOREIGN KEY (CategoryID) REFERENCES RuleCategories(CategoryID)
);

-- Rule-Document Mapping Table - Links rules to document types
-- References existing MasterDocuments table
CREATE TABLE RuleDocumentMapping (
    MappingID INT IDENTITY(1,1) PRIMARY KEY,
    RuleID INT NOT NULL,
    DocumentCode VARCHAR(10) NOT NULL, -- References DocumentCode in MasterDocuments
    IsMandatory BIT DEFAULT 0,
    ValidationPriority INT DEFAULT 5,
    IsActive BIT DEFAULT 1,
    FOREIGN KEY (RuleID) REFERENCES UCPRules(RuleID)
    -- Note: Foreign key constraint to MasterDocuments is not included as it's an existing table
);

-- Rule-MT Message Mapping Table - Links rules to MT message types
-- References existing swift.message_types table
CREATE TABLE RuleMTMessageMapping (
    MappingID INT IDENTITY(1,1) PRIMARY KEY,
    RuleID INT NOT NULL,
    message_type_code VARCHAR(3) NOT NULL, -- References message_type_code in swift.message_types
    FieldTag VARCHAR(20) NULL, -- Specific field in MT message (e.g., "59a")
    IsMandatory BIT DEFAULT 0,
    ValidationPriority INT DEFAULT 5,
    IsActive BIT DEFAULT 1,
    FOREIGN KEY (RuleID) REFERENCES UCPRules(RuleID)
    -- Note: Foreign key constraint to swift.message_types is not included as it's an existing table
);

-- Discrepancy Types Table - Categorizes types of discrepancies
CREATE TABLE DiscrepancyTypes (
    DiscrepancyTypeID INT IDENTITY(1,1) PRIMARY KEY,
    DiscrepancyName NVARCHAR(100) NOT NULL,
    Description NVARCHAR(500) NULL,
    Severity INT DEFAULT 5, -- 1 highest, 10 lowest
    IsActive BIT DEFAULT 1
);

-- Rule-Discrepancy Mapping Table - Links rules to potential discrepancy types
CREATE TABLE RuleDiscrepancyMapping (
    MappingID INT IDENTITY(1,1) PRIMARY KEY,
    RuleID INT NOT NULL,
    DiscrepancyTypeID INT NOT NULL,
    IsActive BIT DEFAULT 1,
    FOREIGN KEY (RuleID) REFERENCES UCPRules(RuleID),
    FOREIGN KEY (DiscrepancyTypeID) REFERENCES DiscrepancyTypes(DiscrepancyTypeID)
);

-- Rule Execution History Table - Audit trail for rule execution
CREATE TABLE RuleExecutionHistory (
    ExecutionID INT IDENTITY(1,1) PRIMARY KEY,
    RuleID INT NOT NULL,
    DocumentReference VARCHAR(100) NULL,
    MTReference VARCHAR(100) NULL,
    ExecutionDate DATETIME2 DEFAULT GETDATE(),
    Result VARCHAR(20) NOT NULL, -- "Pass", "Fail", "Warning"
    DiscrepancyDetails NVARCHAR(MAX) NULL,
    UserID VARCHAR(50) NULL,
    FOREIGN KEY (RuleID) REFERENCES UCPRules(RuleID)
);

-- Create indexes for performance optimization
CREATE INDEX IX_UCPRules_ArticleID ON UCPRules(ArticleID);
CREATE INDEX IX_RuleDocumentMapping_RuleID ON RuleDocumentMapping(RuleID);
CREATE INDEX IX_RuleDocumentMapping_DocumentCode ON RuleDocumentMapping(DocumentCode);
CREATE INDEX IX_RuleMTMessageMapping_RuleID ON RuleMTMessageMapping(RuleID);
CREATE INDEX IX_RuleMTMessageMapping_message_type_code ON RuleMTMessageMapping(message_type_code);

-- =============================================
-- DATA SECTION
-- =============================================

-- Inserting UCP Articles
INSERT INTO UCP_Articles (ArticleID, ArticleNumber, Title, Description, IsActive) VALUES (2, N'2', N'Definitions', N'Definitions of key terms used in UCP 600', 1);
INSERT INTO UCP_Articles (ArticleID, ArticleNumber, Title, Description, IsActive) VALUES (3, N'3', N'Interpretations', N'Rules for interpreting UCP 600 provisions', 1);
INSERT INTO UCP_Articles (ArticleID, ArticleNumber, Title, Description, IsActive) VALUES (4, N'4', N'Credits v. Contracts', N'Relationship between credits and underlying contracts', 1);
INSERT INTO UCP_Articles (ArticleID, ArticleNumber, Title, Description, IsActive) VALUES (5, N'5', N'Documents v. Goods, Services or Performance', N'Banks deal with documents, not goods or services', 1);
INSERT INTO UCP_Articles (ArticleID, ArticleNumber, Title, Description, IsActive) VALUES (6, N'6', N'Availability, Expiry Date and Place for Presentation', N'Requirements for credit availability, expiry, and presentation', 1);
INSERT INTO UCP_Articles (ArticleID, ArticleNumber, Title, Description, IsActive) VALUES (7, N'7', N'Issuing Bank Undertaking', N'Obligations of the issuing bank', 1);

-- Inserting UCP Rules
-- CORRECTED: Added all rule IDs needed for mappings
-- FIXED: Properly escaped JSON strings
INSERT INTO UCPRules (RuleID, RuleCode, ArticleID, RuleText, ValidationLogic, IsActive) 
VALUES (1, N'ART2_DEF1', 2, N'Advising bank means the bank that advises the credit at the request of the issuing bank.', N'{"type": "reference_only", "description": "Definition of advising bank in UCP 600 Article 2."}', 1);

INSERT INTO UCPRules (RuleID, RuleCode, ArticleID, RuleText, ValidationLogic, IsActive) 
VALUES (2, N'ART2_DEF2', 2, N'Applicant means the party on whose request the credit is issued.', N'{"type": "reference_only", "description": "Definition of applicant in UCP 600 Article 2."}', 1);

INSERT INTO UCPRules (RuleID, RuleCode, ArticleID, RuleText, ValidationLogic, IsActive) 
VALUES (3, N'ART2_DEF3', 2, N'Banking day means a day on which a bank is regularly open at the place at which an act subject to these rules is to be performed.', N'{"type": "reference_only", "description": "Definition of banking day in UCP 600 Article 2."}', 1);

INSERT INTO UCPRules (RuleID, RuleCode, ArticleID, RuleText, ValidationLogic, IsActive) 
VALUES (4, N'ART2_DEF4', 2, N'Beneficiary means the party in whose favour a credit is issued.', N'{"type": "reference_only", "description": "Definition of beneficiary in UCP 600 Article 2."}', 1);

INSERT INTO UCPRules (RuleID, RuleCode, ArticleID, RuleText, ValidationLogic, IsActive) 
VALUES (5, N'ART2_DEF5', 2, N'Complying presentation means a presentation that is in accordance with the terms and conditions of the credit, the applicable provisions of these rules and international standard banking practice.', N'{"type": "reference_only", "description": "Definition of complying presentation in UCP 600 Article 2."}', 1);

INSERT INTO UCPRules (RuleID, RuleCode, ArticleID, RuleText, ValidationLogic, IsActive) 
VALUES (6, N'ART2_DEF6', 2, N'Confirmation means a definite undertaking of the confirming bank, in addition to that of the issuing bank, to honour or negotiate a complying presentation.', N'{"type": "reference_only", "description": "Definition of confirmation in UCP 600 Article 2."}', 1);

INSERT INTO UCPRules (RuleID, RuleCode, ArticleID, RuleText, ValidationLogic, IsActive) 
VALUES (7, N'ART3_INT1', 3, N'Words in the singular include the plural and vice versa.', N'{"type": "reference_only", "description": "Interpretation rule for singular/plural in UCP 600 Article 3."}', 1);

INSERT INTO UCPRules (RuleID, RuleCode, ArticleID, RuleText, ValidationLogic, IsActive) 
VALUES (8, N'ART3_INT2', 3, N'A credit is irrevocable even if there is no indication to that effect.', N'{"type": "conditional_obligations", "rules": [{"rule": "All credits are irrevocable", "logic": "validate_irrevocable_credit", "mandatory": true}]}', 1);

INSERT INTO UCPRules (RuleID, RuleCode, ArticleID, RuleText, ValidationLogic, IsActive) 
VALUES (9, N'ART3_INT3', 3, N'A document may be signed by handwriting, facsimile signature, perforated signature, stamp, symbol or any other mechanical or electronic method of authentication.', N'{"type": "conditional_obligations", "rules": [{"rule": "Document authentication methods", "logic": "validate_document_authentication", "mandatory": false}]}', 1);

INSERT INTO UCPRules (RuleID, RuleCode, ArticleID, RuleText, ValidationLogic, IsActive) 
VALUES (10, N'ART3_INT4', 3, N'Branches of a bank in different countries are considered to be separate banks.', N'{"type": "conditional_obligations", "rules": [{"rule": "Branches in different countries are separate banks", "logic": "validate_branch_country_separation", "mandatory": false}]}', 1);

INSERT INTO UCPRules (RuleID, RuleCode, ArticleID, RuleText, ValidationLogic, IsActive) 
VALUES (11, N'ART4_CC1', 4, N'A credit by its nature is a separate transaction from the sale or other contract on which it may be based.', N'{"type": "mandatory_fields", "rules": [{"rule": "Credit is separate from underlying contract", "logic": "validate_credit_separation", "mandatory": true}]}', 1);

INSERT INTO UCPRules (RuleID, RuleCode, ArticleID, RuleText, ValidationLogic, IsActive) 
VALUES (12, N'ART4_CC2', 4, N'Banks are in no way concerned with or bound by such contract, even if any reference whatsoever to it is included in the credit.', N'{"type": "mandatory_fields", "rules": [{"rule": "Banks not bound by underlying contract", "logic": "validate_bank_independence", "mandatory": true}]}', 1);

INSERT INTO UCPRules (RuleID, RuleCode, ArticleID, RuleText, ValidationLogic, IsActive) 
VALUES (13, N'ART4_CC3', 4, N'An issuing bank should discourage any attempt by the applicant to include, as an integral part of the credit, copies of the underlying contract, proforma invoice and the like.', N'{"type": "mandatory_fields", "rules": [{"rule": "No inclusion of underlying contract", "logic": "validate_no_contract_inclusion", "mandatory": false}]}', 1);

INSERT INTO UCPRules (RuleID, RuleCode, ArticleID, RuleText, ValidationLogic, IsActive) 
VALUES (14, N'ART4_CC4', 4, N'A beneficiary can in no case avail itself of the contractual relationships existing between banks or between the applicant and the issuing bank.', N'{"type": "mandatory_fields", "rules": [{"rule": "Beneficiary cannot use bank relationships", "logic": "validate_beneficiary_independence", "mandatory": true}]}', 1);

INSERT INTO UCPRules (RuleID, RuleCode, ArticleID, RuleText, ValidationLogic, IsActive) 
VALUES (15, N'ART5_DG1', 5, N'Banks deal with documents and not with goods, services or performance to which the documents may relate.', N'{"type": "reference_only", "description": "Article 5 establishes that banks deal only with documents, not with goods or services."}', 1);

INSERT INTO UCPRules (RuleID, RuleCode, ArticleID, RuleText, ValidationLogic, IsActive) 
VALUES (16, N'ART5_DG2', 5, N'Banks are not concerned with the condition of goods or services.', N'{"type": "reference_only", "description": "Banks are not responsible for the condition of goods or services."}', 1);

INSERT INTO UCPRules (RuleID, RuleCode, ArticleID, RuleText, ValidationLogic, IsActive) 
VALUES (17, N'ART6_AE1', 6, N'A credit must state the bank with which it is available or whether it is available with any bank.', N'{"type": "mandatory_fields", "rules": [{"rule": "Availability bank must be specified", "logic": "validate_available_bank_specified", "mandatory": true}]}', 1);

INSERT INTO UCPRules (RuleID, RuleCode, ArticleID, RuleText, ValidationLogic, IsActive) 
VALUES (18, N'ART6_AE2', 6, N'A credit available with a nominated bank is also available with the issuing bank.', N'{"type": "reference_only", "description": "Credit available with nominated bank is also available with issuing bank."}', 1);

INSERT INTO UCPRules (RuleID, RuleCode, ArticleID, RuleText, ValidationLogic, IsActive) 
VALUES (19, N'ART6_AE3', 6, N'A credit must state whether it is available by sight payment, deferred payment, acceptance or negotiation.', N'{"type": "mandatory_fields", "rules": [{"rule": "Availability method must be specified", "logic": "validate_availability_method", "mandatory": true}]}', 1);

INSERT INTO UCPRules (RuleID, RuleCode, ArticleID, RuleText, ValidationLogic, IsActive) 
VALUES (20, N'ART6_AE4', 6, N'A credit must not be issued available by a draft drawn on the applicant.', N'{"type": "mandatory_fields", "rules": [{"rule": "No draft on applicant", "logic": "validate_no_draft_on_applicant", "mandatory": true}]}', 1);

INSERT INTO UCPRules (RuleID, RuleCode, ArticleID, RuleText, ValidationLogic, IsActive) 
VALUES (21, N'ART6_AE5', 6, N'A credit must state an expiry date for presentation.', N'{"type": "mandatory_fields", "rules": [{"rule": "Expiry date must be present", "logic": "validate_expiry_date_present", "mandatory": true}]}', 1);

INSERT INTO UCPRules (RuleID, RuleCode, ArticleID, RuleText, ValidationLogic, IsActive) 
VALUES (22, N'ART6_AE6', 6, N'An expiry date stated for honour or negotiation will be deemed to be an expiry date for presentation.', N'{"type": "reference_only", "description": "Expiry date for honour/negotiation is deemed to be expiry date for presentation."}', 1);

INSERT INTO UCPRules (RuleID, RuleCode, ArticleID, RuleText, ValidationLogic, IsActive) 
VALUES (23, N'ART6_AE7', 6, N'The place of the nominated bank at which the credit is available is the place for presentation.', N'{"type": "reference_only", "description": "Place of nominated bank is place for presentation."}', 1);

INSERT INTO UCPRules (RuleID, RuleCode, ArticleID, RuleText, ValidationLogic, IsActive) 
VALUES (24, N'ART6_AE8', 6, N'The place of the issuing bank at which the credit is available is also the place for presentation.', N'{"type": "reference_only", "description": "Place of issuing bank is also place for presentation."}', 1);

INSERT INTO UCPRules (RuleID, RuleCode, ArticleID, RuleText, ValidationLogic, IsActive) 
VALUES (25, N'ART6_AE9', 6, N'Except as provided in sub-article 29 (a), a presentation by or on behalf of the beneficiary must be made on or before the expiry date.', N'{"type": "mandatory_fields", "rules": [{"rule": "Presentation must be made before expiry", "logic": "validate_presentation_before_expiry", "mandatory": true}]}', 1);

INSERT INTO UCPRules (RuleID, RuleCode, ArticleID, RuleText, ValidationLogic, IsActive) 
VALUES (26, N'ART7_IB1', 7, N'Provided that the stipulated documents are presented to the nominated bank or to the issuing bank and that they constitute a complying presentation, the issuing bank must honour.', N'{"type": "conditional_obligations", "rules": [{"rule": "Issuing bank must honour with complying presentation", "condition": "complying_presentation", "logic": "validate_issuing_bank_honour"}]}', 1);

INSERT INTO UCPRules (RuleID, RuleCode, ArticleID, RuleText, ValidationLogic, IsActive) 
VALUES (27, N'ART7_IB2', 7, N'An issuing bank is irrevocably bound to honour as of the time it issues the credit.', N'{"type": "reference_only", "description": "Issuing bank is irrevocably bound to honour from time of issuance."}', 1);

INSERT INTO UCPRules (RuleID, RuleCode, ArticleID, RuleText, ValidationLogic, IsActive) 
VALUES (28, N'ART7_IB3', 7, N'An issuing bank undertakes to reimburse a nominated bank that has honoured or negotiated a complying presentation and forwarded the documents to the issuing bank.', N'{"type": "conditional_obligations", "rules": [{"rule": "Issuing bank must reimburse nominated bank", "condition": "nominated_bank_honoured", "logic": "validate_issuing_bank_reimbursement"}]}', 1);

INSERT INTO UCPRules (RuleID, RuleCode, ArticleID, RuleText, ValidationLogic, IsActive) 
VALUES (29, N'ART7_IB4', 7, N'Reimbursement for the amount of a complying presentation under a credit available by acceptance or deferred payment is due at maturity, whether or not the nominated bank prepaid or purchased before maturity.', N'{"type": "reference_only", "description": "Reimbursement for acceptance or deferred payment is due at maturity."}', 1);

INSERT INTO UCPRules (RuleID, RuleCode, ArticleID, RuleText, ValidationLogic, IsActive) 
VALUES (30, N'ART7_IB5', 7, N'An issuing bank''s undertaking to reimburse a nominated bank is independent of the issuing bank''s undertaking to the beneficiary.', N'{"type": "reference_only", "description": "Issuing bank''s reimbursement undertaking is independent of undertaking to beneficiary."}', 1);

-- Inserting Rule Document Mappings
-- CORRECTED: Ensured all RuleIDs exist in UCPRules table
INSERT INTO RuleDocumentMapping (RuleID, DocumentCode, IsMandatory, ValidationPriority, IsActive) VALUES (1, N'001', 0, 5, 1);
INSERT INTO RuleDocumentMapping (RuleID, DocumentCode, IsMandatory, ValidationPriority, IsActive) VALUES (2, N'008', 0, 5, 1);
INSERT INTO RuleDocumentMapping (RuleID, DocumentCode, IsMandatory, ValidationPriority, IsActive) VALUES (3, N'009', 0, 5, 1);
INSERT INTO RuleDocumentMapping (RuleID, DocumentCode, IsMandatory, ValidationPriority, IsActive) VALUES (7, N'002', 0, 5, 1);
INSERT INTO RuleDocumentMapping (RuleID, DocumentCode, IsMandatory, ValidationPriority, IsActive) VALUES (8, N'003', 0, 5, 1);
INSERT INTO RuleDocumentMapping (RuleID, DocumentCode, IsMandatory, ValidationPriority, IsActive) VALUES (9, N'004', 0, 5, 1);
INSERT INTO RuleDocumentMapping (RuleID, DocumentCode, IsMandatory, ValidationPriority, IsActive) VALUES (10, N'006', 0, 5, 1);
INSERT INTO RuleDocumentMapping (RuleID, DocumentCode, IsMandatory, ValidationPriority, IsActive) VALUES (13, N'001', 0, 5, 1);
INSERT INTO RuleDocumentMapping (RuleID, DocumentCode, IsMandatory, ValidationPriority, IsActive) VALUES (14, N'009', 0, 5, 1);
INSERT INTO RuleDocumentMapping (RuleID, DocumentCode, IsMandatory, ValidationPriority, IsActive) VALUES (17, N'002', 0, 4, 1);
INSERT INTO RuleDocumentMapping (RuleID, DocumentCode, IsMandatory, ValidationPriority, IsActive) VALUES (18, N'003', 0, 4, 1);
INSERT INTO RuleDocumentMapping (RuleID, DocumentCode, IsMandatory, ValidationPriority, IsActive) VALUES (19, N'008', 0, 4, 1);
INSERT INTO RuleDocumentMapping (RuleID, DocumentCode, IsMandatory, ValidationPriority, IsActive) VALUES (22, N'009', 0, 3, 1);
INSERT INTO RuleDocumentMapping (RuleID, DocumentCode, IsMandatory, ValidationPriority, IsActive) VALUES (26, N'009', 0, 3, 1);

-- Inserting Rule MT Message Mappings
-- CORRECTED: Ensured all RuleIDs exist in UCPRules table
INSERT INTO RuleMTMessageMapping (RuleID, message_type_code, FieldTag, IsMandatory, ValidationPriority, IsActive) VALUES (4, N'700', NULL, 0, 4, 1);
INSERT INTO RuleMTMessageMapping (RuleID, message_type_code, FieldTag, IsMandatory, ValidationPriority, IsActive) VALUES (5, N'707', NULL, 0, 4, 1);
INSERT INTO RuleMTMessageMapping (RuleID, message_type_code, FieldTag, IsMandatory, ValidationPriority, IsActive) VALUES (6, N'710', NULL, 0, 4, 1);
INSERT INTO RuleMTMessageMapping (RuleID, message_type_code, FieldTag, IsMandatory, ValidationPriority, IsActive) VALUES (11, N'700', NULL, 0, 4, 1);
INSERT INTO RuleMTMessageMapping (RuleID, message_type_code, FieldTag, IsMandatory, ValidationPriority, IsActive) VALUES (12, N'707', NULL, 0, 4, 1);
INSERT INTO RuleMTMessageMapping (RuleID, message_type_code, FieldTag, IsMandatory, ValidationPriority, IsActive) VALUES (15, N'700', NULL, 0, 3, 1);
INSERT INTO RuleMTMessageMapping (RuleID, message_type_code, FieldTag, IsMandatory, ValidationPriority, IsActive) VALUES (16, N'707', NULL, 0, 3, 1);
INSERT INTO RuleMTMessageMapping (RuleID, message_type_code, FieldTag, IsMandatory, ValidationPriority, IsActive) VALUES (20, N'700', NULL, 0, 3, 1);
INSERT INTO RuleMTMessageMapping (RuleID, message_type_code, FieldTag, IsMandatory, ValidationPriority, IsActive) VALUES (21, N'754', NULL, 0, 3, 1);
INSERT INTO RuleMTMessageMapping (RuleID, message_type_code, FieldTag, IsMandatory, ValidationPriority, IsActive) VALUES (23, N'700', N'31C', 1, 2, 1);
INSERT INTO RuleMTMessageMapping (RuleID, message_type_code, FieldTag, IsMandatory, ValidationPriority, IsActive) VALUES (24, N'700', N'41A', 1, 2, 1);
INSERT INTO RuleMTMessageMapping (RuleID, message_type_code, FieldTag, IsMandatory, ValidationPriority, IsActive) VALUES (25, N'707', N'31E', 1, 2, 1);
INSERT INTO RuleMTMessageMapping (RuleID, message_type_code, FieldTag, IsMandatory, ValidationPriority, IsActive) VALUES (27, N'700', NULL, 0, 2, 1);
INSERT INTO RuleMTMessageMapping (RuleID, message_type_code, FieldTag, IsMandatory, ValidationPriority, IsActive) VALUES (28, N'740', NULL, 0, 2, 1);
INSERT INTO RuleMTMessageMapping (RuleID, message_type_code, FieldTag, IsMandatory, ValidationPriority, IsActive) VALUES (29, N'754', NULL, 0, 2, 1);
INSERT INTO RuleMTMessageMapping (RuleID, message_type_code, FieldTag, IsMandatory, ValidationPriority, IsActive) VALUES (30, N'756', NULL, 0, 2, 1);

-- Inserting Common Discrepancy Types
INSERT INTO DiscrepancyTypes (DiscrepancyName, Description, Severity, IsActive) VALUES (N'Missing Mandatory Field', N'A required field is missing from the document or message', 1, 1);
INSERT INTO DiscrepancyTypes (DiscrepancyName, Description, Severity, IsActive) VALUES (N'Inconsistent Data', N'Data is inconsistent between different documents or fields', 2, 1);
INSERT INTO DiscrepancyTypes (DiscrepancyName, Description, Severity, IsActive) VALUES (N'Expired Document', N'Document has expired or was presented after expiry date', 1, 1);
INSERT INTO DiscrepancyTypes (DiscrepancyName, Description, Severity, IsActive) VALUES (N'Invalid Format', N'Document or field does not conform to required format', 3, 1);
INSERT INTO DiscrepancyTypes (DiscrepancyName, Description, Severity, IsActive) VALUES (N'Unauthorized Modification', N'Document contains unauthorized modifications or alterations', 1, 1);
INSERT INTO DiscrepancyTypes (DiscrepancyName, Description, Severity, IsActive) VALUES (N'Missing Signature', N'Required signature is missing from document', 2, 1);
INSERT INTO DiscrepancyTypes (DiscrepancyName, Description, Severity, IsActive) VALUES (N'Incorrect Amount', N'Amount specified is incorrect or inconsistent', 1, 1);
INSERT INTO DiscrepancyTypes (DiscrepancyName, Description, Severity, IsActive) VALUES (N'Late Presentation', N'Documents presented after the specified deadline', 1, 1);
INSERT INTO DiscrepancyTypes (DiscrepancyName, Description, Severity, IsActive) VALUES (N'Conflicting Terms', N'Terms in document conflict with credit terms', 2, 1);
INSERT INTO DiscrepancyTypes (DiscrepancyName, Description, Severity, IsActive) VALUES (N'Incomplete Set', N'Incomplete set of documents presented', 2, 1);

-- Inserting Rule-Discrepancy Mappings
-- CORRECTED: Using RuleIDs that exist in UCPRules table
INSERT INTO RuleDiscrepancyMapping (RuleID, DiscrepancyTypeID, IsActive) VALUES (6, 1, 1);
INSERT INTO RuleDiscrepancyMapping (RuleID, DiscrepancyTypeID, IsActive) VALUES (6, 4, 1);
INSERT INTO RuleDiscrepancyMapping (RuleID, DiscrepancyTypeID, IsActive) VALUES (6, 8, 1);
INSERT INTO RuleDiscrepancyMapping (RuleID, DiscrepancyTypeID, IsActive) VALUES (7, 1, 1);
INSERT INTO RuleDiscrepancyMapping (RuleID, DiscrepancyTypeID, IsActive) VALUES (7, 2, 1);
INSERT INTO RuleDiscrepancyMapping (RuleID, DiscrepancyTypeID, IsActive) VALUES (7, 9, 1);
