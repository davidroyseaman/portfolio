import React from 'react';
import { hot } from 'react-hot-loader/root';

import Box from '~/components/visual/box.jsx';
import { Rows } from '~/components/grids/rows.jsx';
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

const titleStyles = {};
const doodlesStyles = {
  display: 'grid',
  gridTemplateRows: 'repeat(auto-fit, 250px)',
  gridTemplateColumns: 'repeat(auto-fit, 250px)',
  alignContent: 'center',
  justifyContent: 'center',
  gridGap: '16px',
};

const App = () => {
  return <div style={bgStyles} className="grid">
    <div style={appStyles} className="grid">
      <Rows template="max-content 1fr" gap="16px">
        <div style={titleStyles}>a collection of doodles</div>
        <div style={doodlesStyles}>
          <Box>x</Box>
          <Box>x</Box>
          <Box>x</Box>
          <Box>x</Box>
          <Box>x</Box>
        </div>
      </Rows>
    </div>
  </div>;
};

export default hot(App);