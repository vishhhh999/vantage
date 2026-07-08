export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const { path } = req.query
  if (!path) return res.status(400).json({ error: 'Missing path' })

  const url = `https://${path}`

  console.log('Riot proxy fetching:', url)

  try {
    const response = await fetch(url, {
      headers: {
        'X-Riot-Token': process.env.VITE_RIOT_API_KEY,
        'Accept': 'application/json',
      }
    })

    const data = await response.json()
    console.log('Riot response status:', response.status)

    return res.status(response.status).json(data)
  } catch (err) {
    console.error('Proxy error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
