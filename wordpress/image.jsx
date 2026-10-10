import React from 'react';
export default function Image({ src, alt, fill, preload, priority, quality, sizes, style, ...props }) {
  const base = typeof window === 'undefined' ? '__PIXELY_ASSETS__' : window.PixelyLanding.assets;
  const hero = src === '/images/hero-identity.jpeg';
  return <img {...props} alt={alt} src={hero ? `${base}hero-3200.webp` : src}
    srcSet={hero ? [960,1920,3200,5120].map(w => `${base}hero-${w}.webp ${w}w`).join(', ') : undefined}
    sizes={sizes} fetchPriority={preload || priority ? 'high' : undefined}
    decoding="async" style={{...(fill ? {position:'absolute',inset:0,width:'100%',height:'100%'} : {}), ...style}} />;
}
