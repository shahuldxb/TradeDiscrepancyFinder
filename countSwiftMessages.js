import { connectToAzureSQL } from './server/azureSqlConnection.js';

async function countSwiftMessages() {
  try {
    console.log('Connecting to Azure SQL Server...');
    const pool = await connectToAzureSQL();
    
    // Count SWIFT message types
    const messageTypesResult = await pool.request().query(`
      SELECT COUNT(*) as total_message_types FROM swift.message_types
    `);
    
    // Count SWIFT fields
    const fieldsResult = await pool.request().query(`
      SELECT COUNT(*) as total_fields FROM swift.fields
    `);
    
    // Count message dependencies
    const dependenciesResult = await pool.request().query(`
      SELECT COUNT(*) as total_dependencies FROM swift.message_dependencies
    `);
    
    // Get specific message type details
    const messageTypesDetail = await pool.request().query(`
      SELECT 
        message_type, 
        description, 
        category,
        is_active
      FROM swift.message_types 
      ORDER BY message_type
    `);
    
    // Get Category 7 messages specifically
    const category7Result = await pool.request().query(`
      SELECT COUNT(*) as category7_count 
      FROM swift.message_types 
      WHERE category = '7' OR message_type LIKE 'MT7%'
    `);
    
    console.log('\n=== SWIFT Message Counts ===');
    console.log(`Total Message Types: ${messageTypesResult.recordset[0].total_message_types}`);
    console.log(`Total Fields: ${fieldsResult.recordset[0].total_fields}`);
    console.log(`Total Dependencies: ${dependenciesResult.recordset[0].total_dependencies}`);
    console.log(`Category 7 Messages: ${category7Result.recordset[0].category7_count}`);
    
    console.log('\n=== Message Types Detail ===');
    messageTypesDetail.recordset.forEach(msg => {
      console.log(`${msg.message_type}: ${msg.description} (Category: ${msg.category}, Active: ${msg.is_active})`);
    });
    
    // Get MT700 lifecycle related messages
    const mt700LifecycleResult = await pool.request().query(`
      SELECT DISTINCT
        md.parent_message_type,
        md.child_message_type,
        md.dependency_type,
        md.sequence_order,
        mt.description
      FROM swift.message_dependencies md
      JOIN swift.message_types mt ON mt.message_type = md.child_message_type
      WHERE md.parent_message_type = 'MT700' OR md.child_message_type = 'MT700'
      ORDER BY md.sequence_order
    `);
    
    console.log('\n=== MT700 Lifecycle Messages ===');
    mt700LifecycleResult.recordset.forEach(lifecycle => {
      console.log(`${lifecycle.parent_message_type} -> ${lifecycle.child_message_type}: ${lifecycle.description} (${lifecycle.dependency_type})`);
    });
    
    return {
      totalMessageTypes: messageTypesResult.recordset[0].total_message_types,
      totalFields: fieldsResult.recordset[0].total_fields,
      totalDependencies: dependenciesResult.recordset[0].total_dependencies,
      category7Count: category7Result.recordset[0].category7_count,
      messageTypes: messageTypesDetail.recordset,
      mt700Lifecycle: mt700LifecycleResult.recordset
    };
    
  } catch (error) {
    console.error('Error counting SWIFT messages:', error);
    throw error;
  }
}

// Run the function
countSwiftMessages()
  .then((results) => {
    console.log('\n=== Summary ===');
    console.log(`Your Azure database contains ${results.totalMessageTypes} SWIFT message types`);
    console.log(`with ${results.totalFields} fields and ${results.totalDependencies} dependencies`);
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });