import { transformFile } from 'babel-core';
import simpleReactIntl from './src/index';
import { readFileSync } from 'fs';

const options = {
  presets: [
    'es2015-node5',
  ],
  plugins: [
    'transform-object-rest-spread',
    [simpleReactIntl, { messagesDir: 'build' }],
  ],
};

transformFile('fixture.js', options, () => {});


