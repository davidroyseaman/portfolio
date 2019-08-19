import React from 'react';
import css from '~/styles/base.css';

const Box = ({ children }) => {
  return <div className={css.box}>
    { children }
  </div>;
};

export default Box;
