import { transformFileSync } from 'babel-core';
import simpleReactIntl from '../src/index';
import { expect } from 'chai';
import { readFileSync } from 'fs';
import rimraf from 'rimraf';

const options = {
  presets: [
    'es2015-node5',
  ],
  plugins: [
    'transform-object-rest-spread',
    [simpleReactIntl, { messagesDir: './test/build', moduleSourceName: 'define-messages' }],
  ],
};

describe('Simple react-intil', () => {
  beforeEach(done => rimraf('test/build/', done));

  it('should generate new structure and save to file', () => {
    const { code } = transformFileSync('fixture.js', options);
    const module = { id: 1 };
    const transformedObject = eval(code.match(/\(\{((.|\n)*)\}\)/)[0]);
    const output = JSON.parse(readFileSync('test/build/fixture.json', 'utf8'));

    expect(output).to.have.length(3);
    output.forEach(
      ({ defaultMessage, key, file }) => {
        const transformedItem = transformedObject[key];
        expect(defaultMessage).to.equal(transformedItem.defaultMessage);
        expect(file).to.equal('fixture.js');
        expect(transformedItem.id).to.equal(`1-${key}`);
      }
    );
  });
});
