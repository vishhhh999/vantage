function slugify(name) {
  if (!name) return ''
  return name.toLowerCase().replace(/[^a-z0-9]/g, '')
}

export function agentIconPath(agentName) {
  const slug = slugify(agentName)
  if (!slug) return null
  return `/assets/agents/${slug}.webp`
}

export function mapImagePath(mapName) {
  const slug = slugify(mapName)
  if (!slug) return null
  // summit shipped as .png, every other map as .webp
  const ext = slug === 'summit' ? 'png' : 'webp'
  return `/assets/maps/${slug}.${ext}`
}

// rankName looks like "Immortal 2" or "Radiant" or "Unranked" — convert to
// our "immortal-2" / "radiant" filenames. "Unranked" has no badge asset.
export function rankBadgePath(rankName) {
  if (!rankName || rankName === 'Unranked') return null
  const slug = rankName.toLowerCase().replace(/\s+/g, '-')
  return `/assets/ranks/${slug}.png`
}

export function weaponIconPath(weaponName) {
  const slug = slugify(weaponName)
  if (!slug) return null
  return `/assets/weapons/${slug}.webp`
}
