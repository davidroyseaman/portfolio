import React from 'react';
import css from '~/styles/base.css';
import { primary } from '~/styles/shades.js';

const s = {
  position: 'relative',
  border: `solid 1px ${primary['-4']}`,
  backgroundColor: primary['-3.5'],
  boxShadow: `
    0px 2px 8px 4px ${primary['-4']},
    inset 0px 0px 4px 4px ${primary['-3']}
  `,
};

const titleStyle = {
  position: 'absolute',
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
  display: 'grid',
  placeItems: 'center center',
  fontSize: '32px',
  textShadow: `1px 1px 5px ${primary['-4']}`,
};

const Box = ({ title, children }) => {
  return <div className={css.box} style={s}>
    { children }
    <div style={titleStyle}>{title}</div>
  </div>;
};

export default Box;
