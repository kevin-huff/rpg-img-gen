const { getDatabase } = require('./database')

const SAMPLE_EVENTS = [
  { description: 'Dynamic rooftop leap with cape billowing in the wind', type: 'action', tags: 'parkour,cinematic,heroic' },
  { description: 'Hero braces for impact while energy shield crackles', type: 'combat', tags: 'defense,tech,glow' },
  { description: 'Sorcerer unleashes arcane blast with swirling runes', type: 'magic', tags: 'spellcasting,arcane,light burst' },
  { description: 'Duelists collide in mid-air sword clash, sparks flying', type: 'combat', tags: 'swordplay,mid-air,high-drama' },
  { description: 'Investigator kicks open neon-soaked alley door', type: 'action', tags: 'detective,noir,neon' },
  { description: 'Archer fires triple-shot volley from gargoyle perch', type: 'precision', tags: 'ranged,stealth,gothic' },
  { description: 'Team charges forward in split-panel battle montage', type: 'team', tags: 'ensemble,splash-page,momentum' },
  { description: 'Rogue slides under laser grid with twin daggers ready', type: 'stealth', tags: 'acrobatics,heist,tech' },
  { description: 'Battle mage slams staff to ground, shockwave radiates', type: 'magic', tags: 'shockwave,elemental,earth' },
  { description: 'Pilot vaults into mech cockpit as engines ignite', type: 'tech', tags: 'mecha,launch,hangar' },
  { description: 'Gunslinger spins into cover, muzzle flash lighting dust', type: 'combat', tags: 'western,gunfight,dramatic lighting' },
  { description: 'Heroine performs mid-spin roundhouse surrounded by speed lines', type: 'martial arts', tags: 'kinetic,impact,comic fx' },
  { description: 'Beast tamer whistles as spectral companions materialize', type: 'summoning', tags: 'mystical,companions,ethereal' },
  { description: 'Scientist detonates prototype gadget, rainbow plasma erupts', type: 'tech', tags: 'experiment,chaos,energy' },
  { description: 'Adventurers brace against sandstorm while map glows', type: 'exploration', tags: 'desert,relic-hunt,mystery' }
]

const run = (db, sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function runCallback(err) {
      if (err) {
        return reject(err)
      }
      resolve(this)
    })
  })

const all = (db, sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        return reject(err)
      }
      resolve(rows || [])
    })
  })

async function ensureEventLibrarySeeded(dbInstance = getDatabase()) {
  let existingEvents
  try {
    existingEvents = await all(dbInstance, 'SELECT description FROM events')
  } catch (error) {
    if (error.message?.includes('no such table')) {
      // Table not ready yet; treat as empty and allow caller to retry after migrations
      return { inserted: 0, skipped: 0, needsRetry: true }
    }
    throw error
  }

  const existingDescriptions = new Set(
    existingEvents
      .map(row => row?.description?.trim())
      .filter(Boolean)
  )

  const eventsToInsert = SAMPLE_EVENTS.filter(event => !existingDescriptions.has(event.description))

  if (eventsToInsert.length === 0) {
    console.log('➡️  Event library already populated. Skipping seed.')
    return { inserted: 0, skipped: existingDescriptions.size }
  }

  try {
    await run(dbInstance, 'BEGIN TRANSACTION')
    for (const event of eventsToInsert) {
      await run(
        dbInstance,
        'INSERT INTO events (description, type, tags) VALUES (?, ?, ?)',
        [event.description, event.type || 'action', event.tags || '']
      )
    }
    await run(dbInstance, 'COMMIT')
    console.log(`✅ Seeded ${eventsToInsert.length} cinematic event prompts.`)
    return { inserted: eventsToInsert.length, skipped: existingDescriptions.size }
  } catch (error) {
    await run(dbInstance, 'ROLLBACK').catch(() => {})
    console.error('❌ Failed to seed events:', error)
    throw error
  }
}

module.exports = {
  ensureEventLibrarySeeded,
  SAMPLE_EVENTS,
}
