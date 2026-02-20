const { getDatabase } = require('./database')

const SAMPLE_STYLE_PROFILES = [
  {
    name: 'Dark Fantasy',
    style_preset: 'dark fantasy comic art, heavy blacks',
    composition: 'wide establishing shot',
    lighting: 'cold moonlight with mist',
    mood: 'grim resolve',
    camera: '24mm wide',
    post_processing: 'high-contrast grading',
    ai_style: 'illustration',
    is_default: 1,
  },
  {
    name: 'Cinematic Heroic',
    style_preset: 'cinematic film still, 35mm grain',
    composition: 'rule-of-thirds framing',
    lighting: 'golden hour warm backlight',
    mood: 'triumphant',
    camera: '50mm portrait',
    post_processing: 'teal-orange color grade',
    ai_style: 'photorealistic',
    is_default: 0,
  },
  {
    name: 'Comic Book Action',
    style_preset: 'silver age comic, bold ink lines',
    composition: 'hero landing splash page',
    lighting: 'strobe burst, rim lighting',
    mood: 'ferocious blood-rush',
    camera: 'low angle dynamic',
    post_processing: 'halftone dots, saturated primaries',
    ai_style: 'comic book',
    is_default: 0,
  },
  {
    name: 'Noir Mystery',
    style_preset: 'noir graphic novel, monochrome wash',
    composition: 'dutch angle',
    lighting: 'sodium vapor street lamp',
    mood: 'paranoid dread',
    camera: 'canted close-up',
    post_processing: 'film noir vignette',
    ai_style: 'noir',
    is_default: 0,
  },
  {
    name: 'Whimsical Adventure',
    style_preset: 'saturday morning cartoon, soft cel-shading',
    composition: 'panoramic vista',
    lighting: 'bioluminescent glow',
    mood: 'whimsical mischief',
    camera: 'bird-eye sweeping',
    post_processing: 'pastel bloom',
    ai_style: 'cartoon',
    is_default: 0,
  },
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

async function ensureStyleProfilesSeeded(dbInstance = getDatabase()) {
  let existingProfiles
  try {
    existingProfiles = await all(dbInstance, 'SELECT name FROM style_profiles')
  } catch (error) {
    if (error.message?.includes('no such table')) {
      return { inserted: 0, skipped: 0, needsRetry: true }
    }
    throw error
  }

  const existingNames = new Set(
    existingProfiles
      .map(row => row?.name?.trim())
      .filter(Boolean)
  )

  const profilesToInsert = SAMPLE_STYLE_PROFILES.filter(p => !existingNames.has(p.name))

  if (profilesToInsert.length === 0) {
    console.log('➡️  Style profiles already populated. Skipping seed.')
    return { inserted: 0, skipped: existingNames.size }
  }

  try {
    await run(dbInstance, 'BEGIN TRANSACTION')
    for (const profile of profilesToInsert) {
      await run(
        dbInstance,
        `INSERT INTO style_profiles (name, style_preset, composition, lighting, mood, camera, post_processing, ai_style, is_default)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          profile.name,
          profile.style_preset || '',
          profile.composition || '',
          profile.lighting || '',
          profile.mood || '',
          profile.camera || '',
          profile.post_processing || '',
          profile.ai_style || '',
          profile.is_default || 0,
        ]
      )
    }
    await run(dbInstance, 'COMMIT')
    console.log(`✅ Seeded ${profilesToInsert.length} style profiles.`)
    return { inserted: profilesToInsert.length, skipped: existingNames.size }
  } catch (error) {
    await run(dbInstance, 'ROLLBACK').catch(() => {})
    console.error('❌ Failed to seed style profiles:', error)
    throw error
  }
}

module.exports = {
  ensureStyleProfilesSeeded,
  SAMPLE_STYLE_PROFILES,
}
