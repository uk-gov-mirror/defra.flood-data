const { Pool } = require('../helpers/pool')
const fwis = require('../models/fwis')
const wreck = require('../helpers/wreck')

module.exports.handler = async (event) => {
  console.log('Lambda triggered with event:', JSON.stringify(event))

  const pool = new Pool({ connectionString: process.env.LFW_DATA_DB_CONNECTION })
  console.log('Database pool initialized')
  try {
    console.log('Requesting warnings from FWIS API...')
    const { warnings } = await wreck.request('get', process.env.LFW_DATA_FWIS_API_URL, {
      json: true,
      headers: {
        'x-api-key': process.env.LFW_DATA_FWIS_API_KEY
      },
      timeout: 30000
    }, true)

    console.log(`Received ${warnings.length} warnings from FWIS API`)

    const timestamp = Math.floor(Date.now() / 1000)
    console.log(`Current timestamp: ${timestamp}`)

    console.log('Saving warnings to database...')
    await fwis.save(warnings, timestamp, pool)
    console.log('Warnings saved successfully')
  } catch (error) {
    console.error('Error occurred during Lambda execution:', error)
    throw error
  } finally {
    console.log('Closing database pool...')
    await pool.end()
    console.log('Database pool closed')
  }
}
