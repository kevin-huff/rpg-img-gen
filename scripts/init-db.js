#!/usr/bin/env node

const { initializeDatabase, getDatabase } = require('../db/database')
const { ensureEventLibrarySeeded } = require('../db/seedEvents')

function getCount(db, table) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT COUNT(*) as count FROM ${table}`, (err, row) => {
      if (err) {
        return reject(err)
      }
      resolve(row?.count ?? 0)
    })
  })
}

async function main() {
  try {
    console.log('Initializing database...')
    await initializeDatabase()
    const db = getDatabase()

    const seedResult = await ensureEventLibrarySeeded(db)
    if (seedResult?.needsRetry) {
      // Table was unavailable; migrations probably still running. Try again now that init finished.
      await ensureEventLibrarySeeded(db)
    }

    console.log('✅ Database initialized successfully!')

    console.log('\nDatabase tables created:')
    console.log('- scenes')
    console.log('- characters')
    console.log('- events')
    console.log('- templates')
    console.log('- images')
    console.log('- template_scenes')
    console.log('- template_characters')

    const eventCount = await getCount(db, 'events')
    console.log(`\n🎭 Event library entries: ${eventCount}`)

    console.log('\n🎉 Your RPG Image Generator is ready to use!')
    console.log('\nNext steps:')
    console.log('1. Start the backend server: npm run dev')
    console.log('2. Start the frontend: npm run frontend:dev')
    console.log('3. Open http://localhost:5173 in your browser')

    process.exit(0)
  } catch (error) {
    console.error('❌ Failed to initialize database:', error)
    process.exit(1)
  }
}

main()
