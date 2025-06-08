import { discoverTableStructure, discoverAllSwiftTables } from './azureTableInspector';

async function inspectSwiftTables() {
  console.log('Starting Azure SWIFT table inspection...');
  
  // Discover all tables first
  await discoverAllSwiftTables();
  
  // Inspect key tables for field data
  const tablesToInspect = [
    'message_fields',
    'field_specifications', 
    'field_validation_rules',
    'message_types',
    'swift_fields'
  ];
  
  for (const tableName of tablesToInspect) {
    await discoverTableStructure(tableName);
  }
}

inspectSwiftTables().catch(console.error);