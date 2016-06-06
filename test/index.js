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
    const { checkbox, select, button } = eval(code.match(/\(\{((.|\n)*)\}\)/)[0]);

    expect(checkbox.id).to.equal('1-checkbox');
    expect(checkbox.defaultMessage).to.equal('情景模拟');

    expect(select.id).to.equal('1-select');
    expect(select.defaultMessage).to.equal('请选择情景');

    expect(button.id).to.equal('1-button');
    expect(button.defaultMessage).to.equal('开始模拟');
  });
});
