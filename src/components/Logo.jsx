
export default function Logo({ variant = 'icon', className = '', alt = 'LA Colectivo' }) {
  const src = variant === 'full' ? '/logo-full.png' : '/logo-icon.png'
  return <img src={src} alt={alt} className={`logo logo--${variant} ${className}`} />
}
