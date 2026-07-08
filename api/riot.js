export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const { path } = req.query

  if (!path) {
    return res.status(400).json({ error: 'Missing path parameter' })
  }

  const riotPath = Array.isArray(path) ? path.join('/') : path
  const queryParams = { ...req.query }
  delete queryParams.path

  const queryString = new URLSearchParams(queryParams).toString()
  const url = `https://${riotPath}${queryString ? `?${queryString}` : ''}`

  try {
    const response = await fetch(url, {
      headers: {
        'X-Riot-Token': process.env.VITE_RIOT_API_KEY,
        'Accept': 'application/json',
      }
    })

    const data = await response.json()

    if (!response.ok) {
      return res.status(response.status).json(data)
    }

    return res.status(200).json(data)
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Proxy request failed' })
  }
}
