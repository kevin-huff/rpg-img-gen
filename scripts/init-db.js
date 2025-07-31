#!/usr/bin/env node

const { initializeDatabase } = require('../db/database');

async function main() {
  try {
    console.log('Initializing database...');
    await initializeDatabase();
    console.log('✅ Database initialized successfully!');
    
    console.log('\nDatabase tables created:');
    console.log('- scenes');
    console.log('- characters');
    console.log('- events');
    console.log('- templates');
    console.log('- images');
    console.log('- template_scenes');
    console.log('- template_characters');
    
    console.log('\n🎉 Your RPG Image Generator is ready to use!');
    console.log('\nNext steps:');
    console.log('1. Start the backend server: npm run dev');
    console.log('2. Start the frontend: npm run frontend:dev');
    console.log('3. Open http://localhost:5173 in your browser');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    process.exit(1);
  }
}

main();
