import React from 'react';
import { renderToString } from 'react-dom/server';
import Home from '../src/app/page';
export const html = renderToString(<Home />);
