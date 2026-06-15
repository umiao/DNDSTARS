import { BULLET_TYPE_STYLES, bulletImageUrl } from '../../lib/bulletMatch'

interface BulletIconProps {
  type: number
  size?: number
  className?: string
}

/** 元素子弹贴图（public/bullets/{type}.svg） */
export default function BulletIcon({ type, size = 24, className = '' }: BulletIconProps) {
  const safe = Math.max(0, Math.min(6, type))
  const style = BULLET_TYPE_STYLES[safe]
  return (
    <img
      src={bulletImageUrl(safe)}
      alt=""
      width={size}
      height={size}
      draggable={false}
      className={`pointer-events-none select-none object-contain drop-shadow-sm ${className}`}
      style={{ width: size, height: size }}
      title={style.name}
    />
  )
}
