import React from 'react';
import ReactDOM from 'react-dom';
import App from '~/components/App';
import '~/styles/global.css';

const root = document.createElement('div');
root.id = 'root';
document.body.appendChild(root);

ReactDOM.render(<App />, root);
