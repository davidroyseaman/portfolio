import React from 'react';

const Rows = ({ template, children, gap = 0, dense = false }) => {
  return <div style={{
    display: 'grid',
    gridTemplateRows: template,
    justifyContent: dense ? 'start' : 'stretch',
    gridGap: gap,
  }}>
    { children }
  </div>;
};

export { Rows };
