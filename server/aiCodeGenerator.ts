import OpenAI from "openai";
import { connectToAzureSQL } from './azureSqlConnection';
import sql from 'mssql';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface CodeGenerationRequest {
  messageType: string;
  variation: string;
  programmingLanguage: string;
  framework?: string;
  includeValidation?: boolean;
  includeFormatting?: boolean;
}

interface CodeGenerationResult {
  code: string;
  explanation: string;
  dependencies: string[];
  examples: string[];
}

export async function generateSwiftCodeSnippet(request: CodeGenerationRequest): Promise<CodeGenerationResult> {
  try {
    // Get comprehensive message data from Azure SQL
    const messageData = await getMessageDataForGeneration(request.messageType);
    
    const prompt = `
You are an expert SWIFT message developer. Generate ${request.programmingLanguage} code for handling SWIFT MT${request.messageType} messages with the following variation: ${request.variation}.

Based on this authentic SWIFT message specification from the official database:

Message Type: MT${messageData.messageType.message_type_code} - ${messageData.messageType.message_type_name}
Purpose: ${messageData.messageType.purpose}

Fields (${messageData.fields.length} total):
${messageData.fields.map(field => 
  `- Tag ${field.tag}: ${field.field_name} (${field.is_mandatory ? 'Mandatory' : 'Optional'})`
).join('\n')}

Validation Rules:
${messageData.validationRules.slice(0, 5).map(rule => 
  `- ${rule.rule_description}`
).join('\n')}

Requirements:
- Programming Language: ${request.programmingLanguage}
${request.framework ? `- Framework: ${request.framework}` : ''}
- Include validation: ${request.includeValidation ? 'Yes' : 'No'}
- Include formatting: ${request.includeFormatting ? 'Yes' : 'No'}
- Variation focus: ${request.variation}

Generate production-ready code that:
1. Implements the specific variation requested
2. Follows SWIFT standards exactly as specified
3. Includes proper error handling
4. Uses the exact field tags and validation rules from the specification
5. Includes clear comments explaining SWIFT-specific logic

Respond with JSON in this format:
{
  "code": "Complete code implementation",
  "explanation": "Detailed explanation of the implementation",
  "dependencies": ["List of required dependencies"],
  "examples": ["Usage examples"]
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert SWIFT message developer with deep knowledge of financial messaging standards. Generate accurate, production-ready code based on official SWIFT specifications."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      code: result.code || '',
      explanation: result.explanation || '',
      dependencies: result.dependencies || [],
      examples: result.examples || []
    };

  } catch (error) {
    console.error('Error generating code snippet:', error);
    throw new Error('Failed to generate code snippet');
  }
}

async function getMessageDataForGeneration(messageTypeCode: string) {
  const pool = await connectToAzureSQL();
  
  // Get message type info
  const messageResult = await pool.request()
    .input('messageType', sql.NVarChar, messageTypeCode)
    .query(`
      SELECT * FROM swift.message_types 
      WHERE message_type_code = @messageType
    `);
  
  // Get message fields
  const fieldsResult = await pool.request()
    .input('messageType', sql.NVarChar, messageTypeCode)
    .query(`
      SELECT mf.* FROM swift.message_fields mf
      INNER JOIN swift.message_types mt ON mf.message_type_id = mt.message_type_id
      WHERE mt.message_type_code = @messageType
      ORDER BY mf.sequence
    `);
  
  // Get validation rules
  const rulesResult = await pool.request()
    .input('messageType', sql.NVarChar, messageTypeCode)
    .query(`
      SELECT nvr.* FROM swift.network_validated_rules nvr
      INNER JOIN swift.message_types mt ON nvr.message_type_id = mt.message_type_id
      WHERE mt.message_type_code = @messageType
    `);
  
  await pool.close();
  
  return {
    messageType: messageResult.recordset[0],
    fields: fieldsResult.recordset,
    validationRules: rulesResult.recordset
  };
}

export async function generateCodeVariations(messageType: string, programmingLanguage: string) {
  const variations = [
    'Message Parser',
    'Message Builder',
    'Validation Engine',
    'Field Extractor',
    'Format Converter',
    'Error Handler'
  ];
  
  const results = [];
  
  for (const variation of variations) {
    try {
      const result = await generateSwiftCodeSnippet({
        messageType,
        variation,
        programmingLanguage,
        includeValidation: true,
        includeFormatting: true
      });
      
      results.push({
        variation,
        ...result
      });
    } catch (error) {
      console.error(`Error generating ${variation}:`, error);
    }
  }
  
  return results;
}

export async function generateCustomCodeSnippet(
  messageType: string,
  customPrompt: string,
  programmingLanguage: string
): Promise<CodeGenerationResult> {
  try {
    const messageData = await getMessageDataForGeneration(messageType);
    
    const prompt = `
Based on the official SWIFT MT${messageType} specification:

Message: ${messageData.messageType.message_type_name}
Purpose: ${messageData.messageType.purpose}

Fields: ${messageData.fields.length} total fields including mandatory fields like ${messageData.fields.filter(f => f.is_mandatory).slice(0, 3).map(f => f.tag).join(', ')}

Custom Request: ${customPrompt}
Programming Language: ${programmingLanguage}

Generate production-ready ${programmingLanguage} code that implements the custom request while following official SWIFT standards.

Respond with JSON:
{
  "code": "Implementation code",
  "explanation": "How it works",
  "dependencies": ["Required packages"],
  "examples": ["Usage examples"]
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a SWIFT messaging expert. Generate accurate code based on official specifications."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2
    });

    return JSON.parse(response.choices[0].message.content || '{}');
    
  } catch (error) {
    console.error('Error generating custom code:', error);
    throw new Error('Failed to generate custom code snippet');
  }
}