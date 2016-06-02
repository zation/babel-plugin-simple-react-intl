import { transformFileSync } from 'babel-core';
import simpleReactIntl from '../src/index';
import { expect } from 'chai';
import { readFileSync } from 'fs';

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
  it('should generate new structure and save to file', () => {
    const { code } = transformFileSync('fixture.js', options);
    const { checkbox, select, button } = eval(code.match(/\(\{((.|\n)*)\}\)/)[0]);
    const output = JSON.parse(readFileSync('test/build/fixture.json', 'utf8'))

    expect(checkbox.id).to.equal(output[0].id);
    expect(checkbox.defaultMessage).to.equal(output[0].defaultMessage);

    expect(select.id).to.equal(output[1].id);
    expect(select.defaultMessage).to.equal(output[1].defaultMessage);

    expect(button.id).to.equal(output[2].id);
    expect(button.defaultMessage).to.equal(output[2].defaultMessage);
  });
});
