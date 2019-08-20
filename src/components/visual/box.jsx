import React from 'react';
import css from '~/styles/base.css';
import { primary } from '~/styles/shades.js';

const s = {
  border: `solid 1px ${primary['-4']}`,
  backgroundColor: primary['-3.5'],
  boxShadow: `
    0px 2px 8px 4px ${primary['-4']},
    inset 0px 0px 4px 4px ${primary['-3']}
  `,
}

const Box = ({ children }) => {
  return <div className={css.box} style={s}>
    { children }
  </div>;
};

export default Box;
