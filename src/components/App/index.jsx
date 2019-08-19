import React from 'react';
import { hot } from 'react-hot-loader/root';

import Box from '~/components/visual/box.jsx';
import { primary } from '~/styles/shades.js';

const bgStyles = {
  backgroundColor: 'black',
  padding: '20px',
};

const appStyles = {
  border: 'solid 1px black',
  borderRadius: '4px',
  padding: '16px',
  backgroundColor: primary['-3'],
  boxShadow: `
    0px 2px 5px 0px ${primary['-3.5']},
    inset 0px 0px 2px 2px ${primary['-2.5']}
  `,
  color: 'hsla(0, 0%, 100%, 0.5)',
  fontFamily: 'monospace',
  fontSize: '32px',
};

const App = () => {
  return <div style={bgStyles} className="grid">
    <div style={appStyles}>
      <Box>a collection of doodles</Box>
    </div>
  </div>;
};

export default hot(App);