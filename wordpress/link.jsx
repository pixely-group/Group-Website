import React from 'react';
export default function Link({ href, prefetch, replace, scroll, ...props }) {
  return <a {...props} href={href === '/privacy' ? '?pixely_privacy=1' : href} />;
}
