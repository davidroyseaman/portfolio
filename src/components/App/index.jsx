import React from 'react';
import { hot } from 'react-hot-loader/root';

import Box from '~/components/visual/box.jsx';
import { Rows } from '~/components/grids/rows.jsx';
import { primary } from '~/styles/shades.js';

import { Swarm } from '~/components/demos/swarm/index.jsx';

const bgStyles = {
  backgroundColor: primary['-4'],
  padding: '64px',
};

// dsx rgba is cheating need -4.5, -5, etc.
const appStyles = {
  border: `solid 1px ${primary['-4']}`,
  borderRadius: '4px',
  padding: '16px',
  backgroundColor: primary['-3.5'],
  boxShadow: `
    0px 2px 8px 4px rgba(0,0,0,0.2),
    inset 0px 0px 4px 4px ${primary['-3']}
  `,
  color: 'hsla(0, 0%, 100%, 0.5)',
  fontSize: '32px',
};

const titleStyles = {};
const doodlesStyles = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, 250px)',
  gridAutoRows: '250px',
  alignContent: 'center',
  justifyContent: 'center',
  gridGap: '16px',
  fontFamily: '\'Exo 2\', sans-serif',
  fontSize: '16px',
};

const App = () => {
  return <div style={bgStyles} className="grid">
    <div style={appStyles} className="grid">
      <Rows template="max-content 1fr" gap="16px">
        <div style={titleStyles}>Experiments, exercises, investigations and toys.</div>
        <div style={doodlesStyles}>
          <Box>The spectacle before us was indeed sublime. </Box>
          <Box><Swarm /></Box>
          <Box></Box>
          <Box></Box>
          <Box></Box>
        </div>
      </Rows>
    </div>
  </div>;
};

export default hot(App);