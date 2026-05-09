type AvatarProps = {
  username: string
  avatarUrl?: string | null
  size?: number
  radius?: number
}

export default function Avatar({ username, avatarUrl, size = 40, radius = 12 }: AvatarProps) {
  return (
    <div style={{
      width: size, height: size, borderRadius: radius,
      background: 'rgba(232, 84, 26, 0.15)',
      color: '#E8541A',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 'bold', fontSize: size * 0.35,
      overflow: 'hidden', flexShrink: 0
    }}>
      {avatarUrl ? (
        <img src={avatarUrl} alt={username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        username?.[0]?.toUpperCase()
      )}
    </div>
  )
}