import React, { useEffect, useState } from 'react';
export default function dynamic(load, options = {}) {
  return function Deferred(props) {
    const [Component, setComponent] = useState(null);
    useEffect(() => { let active = true; load().then(m => { if (active) setComponent(() => m.default); }); return () => { active = false; }; }, []);
    const Fallback = options.loading;
    return Component ? <Component {...props} /> : Fallback ? <Fallback /> : null;
  };
}
