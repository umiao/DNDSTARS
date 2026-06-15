import { useEffect, useState } from 'react'
import {
  loadBurningIcon,
  loadIgniteIcon,
  loadKnockbackIcon,
  loadPoisonIcon,
  loadProcessedImage,
  type StripIconOptions,
} from '../lib/imageAlpha'

interface ProcessedIconProps {
  src: string
  alt?: string
  className?: string
  fallback?: string
  options?: StripIconOptions
  knockback?: boolean
  burning?: boolean
  ignite?: boolean
  poison?: boolean
}

export default function ProcessedIcon({
  src,
  alt = '',
  className,
  fallback,
  options,
  knockback,
  burning,
  ignite,
  poison,
}: ProcessedIconProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const loader = knockback
      ? loadKnockbackIcon()
      : burning
        ? loadBurningIcon()
        : ignite
          ? loadIgniteIcon()
          : poison
            ? loadPoisonIcon()
            : loadProcessedImage(src, options)
    loader.then((canvas) => {
      if (!cancelled && canvas) setDataUrl(canvas.toDataURL('image/png'))
    })
    return () => {
      cancelled = true
    }
  }, [src, knockback, burning, ignite, poison, options?.circleMask])

  if (dataUrl) {
    return <img src={dataUrl} alt={alt} className={className} draggable={false} />
  }
  if (fallback) {
    return <span className={className}>{fallback}</span>
  }
  return null
}
