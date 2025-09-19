#!/usr/bin/env node

const { initializeDatabase, getDatabase } = require('../db/database');

function getCount(db, table) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT COUNT(*) as count FROM ${table}`, (err, row) => {
      if (err) {
        return reject(err);
      }
      resolve(row?.count ?? 0);
    });
  });
}

async function seedEvents(db) {
  const existing = await getCount(db, 'events');
  if (existing > 0) {
    console.log(`➡️  Events table already has ${existing} entries. Skipping seed.`);
    return;
  }

  const sampleEvents = [
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
  ];

  const run = (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, (err) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });

  try {
    await run('BEGIN TRANSACTION');
    for (const event of sampleEvents) {
      await run(
        'INSERT INTO events (description, type, tags) VALUES (?, ?, ?)',
        [event.description, event.type, event.tags]
      );
    }
    await run('COMMIT');
    console.log(`✅ Seeded ${sampleEvents.length} cinematic event prompts.`);
  } catch (error) {
    await run('ROLLBACK').catch(() => {});
    console.error('❌ Failed to seed events:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('Initializing database...');
    await initializeDatabase();
    const db = getDatabase();
    await seedEvents(db);
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
