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
    const [
      checkboxOutput,
      selectOutput,
      buttonOutput,
    ] = JSON.parse(readFileSync('test/build/fixture.json', 'utf8'))

    expect(checkbox.id).to.equal(checkboxOutput.id);
    expect(checkbox.defaultMessage).to.equal(checkboxOutput.defaultMessage);
    expect(checkboxOutput.key).to.equal('checkbox');
    expect(checkboxOutput.file).to.equal('fixture.js');

    expect(select.id).to.equal(selectOutput.id);
    expect(select.defaultMessage).to.equal(selectOutput.defaultMessage);
    expect(selectOutput.key).to.equal('select');
    expect(selectOutput.file).to.equal('fixture.js');

    expect(button.id).to.equal(buttonOutput.id);
    expect(button.defaultMessage).to.equal(buttonOutput.defaultMessage);
    expect(buttonOutput.key).to.equal('button');
    expect(buttonOutput.file).to.equal('fixture.js');
  });
});
