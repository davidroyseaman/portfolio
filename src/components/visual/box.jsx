import React from 'react';
import css from '~/styles/base.css';
import { primary } from '~/styles/shades.js';


const Box = ({ children }) => {
  return <div className={css.box} style={{background: primary['-4']}}>
    { children }
  </div>;
};

export default Box;
