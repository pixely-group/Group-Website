import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import Home from '../src/app/page';

hydrateRoot(document.getElementById('pixely-root'), <Home />);
