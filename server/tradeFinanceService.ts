import { connectToAzureSQL } from './azureSqlConnection';
import sql from 'mssql';

export interface DocumentaryCredit {
  creditId: number;
  creditCode: string;
  creditName: string;
  description: string;
  isActive: boolean;
}

export interface MasterDocument {
  documentId: number;
  documentCode: string;
  documentName: string;
  description: string;
  isActive: boolean;
}

export interface SwiftMessageCode {
  swiftCodeId: number;
  swiftCode: string;
  description: string;
  isActive: boolean;
}

export interface DocumentRequirement {
  requirementId: number;
  creditId: number;
  documentId: number;
  isMandatory: boolean;
  isConditional: boolean;
  condition?: string;
  isActive: boolean;
}

export interface CreditDocumentSummary {
  creditId: number;
  creditCode: string;
  creditName: string;
  mandatoryDocumentCount: number;
  optionalDocumentCount: number;
}

export interface SwiftDocumentMapping {
  documentId: number;
  documentCode: string;
  documentName: string;
  swiftCode: string;
  swiftDescription: string;
  numberOfCreditTypes: number;
  status: string;
}

export async function getAllDocumentaryCredits(): Promise<DocumentaryCredit[]> {
  try {
    const pool = await connectToAzureSQL();
    
    const result = await pool.request().query(`
      SELECT CreditID as creditId, CreditCode as creditCode, 
             CreditName as creditName, Description as description, 
             IsActive as isActive
      FROM DocumentaryCredits 
      WHERE IsActive = 1
      ORDER BY CreditCode
    `);
    
    await pool.close();
    return result.recordset;
  } catch (error) {
    console.error('Error fetching documentary credits:', error);
    throw error;
  }
}

export async function getAllMasterDocuments(): Promise<MasterDocument[]> {
  try {
    const pool = await connectToAzureSQL();
    
    const result = await pool.request().query(`
      SELECT DocumentID as documentId, DocumentCode as documentCode,
             DocumentName as documentName, Description as description,
             IsActive as isActive
      FROM MasterDocuments 
      WHERE IsActive = 1
      ORDER BY DocumentCode
    `);
    
    await pool.close();
    return result.recordset;
  } catch (error) {
    console.error('Error fetching master documents:', error);
    throw error;
  }
}

export async function getAllSwiftMessageCodes(): Promise<SwiftMessageCode[]> {
  try {
    const pool = await connectToAzureSQL();
    
    const result = await pool.request().query(`
      SELECT SwiftCodeID as swiftCodeId, SwiftCode as swiftCode,
             Description as description, IsActive as isActive
      FROM SwiftMessageCodes 
      WHERE IsActive = 1
      ORDER BY SwiftCode
    `);
    
    await pool.close();
    return result.recordset;
  } catch (error) {
    console.error('Error fetching SWIFT message codes:', error);
    throw error;
  }
}

export async function getCreditDocumentSummary(): Promise<CreditDocumentSummary[]> {
  try {
    const pool = await connectToAzureSQL();
    
    const result = await pool.request().query(`
      SELECT
        dc.CreditID as creditId,
        dc.CreditCode as creditCode,
        dc.CreditName as creditName,
        SUM(CASE WHEN dr.IsMandatory = 1 THEN 1 ELSE 0 END) AS mandatoryDocumentCount,
        SUM(CASE WHEN dr.IsMandatory = 0 THEN 1 ELSE 0 END) AS optionalDocumentCount
      FROM
        DocumentaryCredits dc
      LEFT JOIN
        DocumentRequirements dr ON dc.CreditID = dr.CreditID
      WHERE
        dc.IsActive = 1 AND (dr.IsActive = 1 OR dr.IsActive IS NULL)
      GROUP BY
        dc.CreditID, dc.CreditCode, dc.CreditName
      ORDER BY
        dc.CreditCode
    `);
    
    await pool.close();
    return result.recordset;
  } catch (error) {
    console.error('Error fetching credit document summary:', error);
    throw error;
  }
}

export async function getDocumentsForSwiftMessage(swiftCode: string): Promise<SwiftDocumentMapping[]> {
  try {
    const pool = await connectToAzureSQL();
    
    const result = await pool.request()
      .input('swiftCode', sql.NVarChar, swiftCode)
      .query(`
        SELECT DISTINCT
          d.DocumentID as documentId,
          d.DocumentCode as documentCode,
          d.DocumentName as documentName,
          d.Description as description,
          CASE WHEN dr.IsMandatory = 1 THEN 'Mandatory' ELSE 'Optional' END AS status
        FROM
          MasterDocuments d
        JOIN
          DocumentRequirements dr ON d.DocumentID = dr.DocumentID
        JOIN
          DocumentaryCredits c ON dr.CreditID = c.CreditID
        JOIN
          CreditSwiftMapping m ON c.CreditID = m.CreditID
        JOIN
          SwiftMessageCodes s ON m.SwiftCodeID = s.SwiftCodeID
        WHERE
          s.SwiftCode = @swiftCode
          AND d.IsActive = 1
          AND dr.IsActive = 1
          AND c.IsActive = 1
          AND m.IsActive = 1
          AND s.IsActive = 1
        ORDER BY
          dr.IsMandatory DESC, d.DocumentCode
      `);
    
    await pool.close();
    return result.recordset;
  } catch (error) {
    console.error('Error fetching documents for SWIFT message:', error);
    throw error;
  }
}

export async function getDocumentsForCredit(creditCode: string): Promise<any[]> {
  try {
    const pool = await connectToAzureSQL();
    
    const result = await pool.request()
      .input('creditCode', sql.NVarChar, creditCode)
      .query(`
        SELECT DISTINCT
          d.DocumentID as documentId,
          d.DocumentCode as documentCode,
          d.DocumentName as documentName,
          d.Description as description,
          CASE WHEN dr.IsMandatory = 1 THEN 'Mandatory' ELSE 'Optional' END AS status,
          dr.IsConditional as isConditional,
          dr.Condition as condition
        FROM
          MasterDocuments d
        JOIN
          DocumentRequirements dr ON d.DocumentID = dr.DocumentID
        JOIN
          DocumentaryCredits c ON dr.CreditID = c.CreditID
        WHERE
          c.CreditCode = @creditCode
          AND d.IsActive = 1
          AND dr.IsActive = 1
          AND c.IsActive = 1
        ORDER BY
          dr.IsMandatory DESC, d.DocumentCode
      `);
    
    await pool.close();
    return result.recordset;
  } catch (error) {
    console.error('Error fetching documents for credit:', error);
    throw error;
  }
}

export async function getSwiftCreditMappings(): Promise<any[]> {
  try {
    const pool = await connectToAzureSQL();
    
    const result = await pool.request().query(`
      SELECT
        c.CreditCode as creditCode,
        c.CreditName as creditName,
        s.SwiftCode as swiftCode,
        s.Description as swiftDescription
      FROM
        DocumentaryCredits c
      JOIN
        CreditSwiftMapping m ON c.CreditID = m.CreditID
      JOIN
        SwiftMessageCodes s ON m.SwiftCodeID = s.SwiftCodeID
      WHERE
        c.IsActive = 1
        AND m.IsActive = 1
        AND s.IsActive = 1
      ORDER BY
        c.CreditCode, s.SwiftCode
    `);
    
    await pool.close();
    return result.recordset;
  } catch (error) {
    console.error('Error fetching SWIFT credit mappings:', error);
    throw error;
  }
}

export async function getDocumentSwiftRelationships(): Promise<SwiftDocumentMapping[]> {
  try {
    const pool = await connectToAzureSQL();
    
    const result = await pool.request().query(`
      SELECT DISTINCT
        d.DocumentID as documentId,
        d.DocumentCode as documentCode,
        d.DocumentName as documentName,
        s.SwiftCode as swiftCode,
        s.Description AS swiftDescription,
        COUNT(DISTINCT c.CreditID) AS numberOfCreditTypes
      FROM
        MasterDocuments d
      JOIN
        DocumentRequirements dr ON d.DocumentID = dr.DocumentID
      JOIN
        DocumentaryCredits c ON dr.CreditID = c.CreditID
      JOIN
        CreditSwiftMapping m ON c.CreditID = m.CreditID
      JOIN
        SwiftMessageCodes s ON m.SwiftCodeID = s.SwiftCodeID
      WHERE
        d.IsActive = 1
        AND dr.IsActive = 1
        AND c.IsActive = 1
        AND m.IsActive = 1
        AND s.IsActive = 1
      GROUP BY
        d.DocumentID, d.DocumentCode, d.DocumentName, s.SwiftCode, s.Description
      ORDER BY
        d.DocumentCode, s.SwiftCode
    `);
    
    await pool.close();
    return result.recordset;
  } catch (error) {
    console.error('Error fetching document SWIFT relationships:', error);
    throw error;
  }
}

export async function getTradeFinanceStatistics(): Promise<any> {
  try {
    const pool = await connectToAzureSQL();
    
    // Get counts
    const creditsResult = await pool.request().query(`
      SELECT COUNT(*) as count FROM DocumentaryCredits WHERE IsActive = 1
    `);
    
    const documentsResult = await pool.request().query(`
      SELECT COUNT(*) as count FROM MasterDocuments WHERE IsActive = 1
    `);
    
    const swiftResult = await pool.request().query(`
      SELECT COUNT(*) as count FROM SwiftMessageCodes WHERE IsActive = 1
    `);
    
    const mappingsResult = await pool.request().query(`
      SELECT COUNT(*) as count FROM CreditSwiftMapping WHERE IsActive = 1
    `);
    
    const requirementsResult = await pool.request().query(`
      SELECT COUNT(*) as count FROM DocumentRequirements WHERE IsActive = 1
    `);
    
    await pool.close();
    
    return {
      totalCredits: creditsResult.recordset[0].count,
      totalDocuments: documentsResult.recordset[0].count,
      totalSwiftMessages: swiftResult.recordset[0].count,
      totalMappings: mappingsResult.recordset[0].count,
      totalRequirements: requirementsResult.recordset[0].count
    };
  } catch (error) {
    console.error('Error fetching trade finance statistics:', error);
    throw error;
  }
}