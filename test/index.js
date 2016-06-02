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

const defaultMessages = ['情景模拟', '请选择情景', '开始模拟'];

describe('Simple react-intil', () => {
  it('should generate new structure', () => {
    const { code } = transformFileSync('fixture.js', options);
    const { checkbox, select, button } = eval(code.match(/\(\{((.|\n)*)\}\)/)[0]);

    expect(checkbox.id).to.be.a('string');
    expect(checkbox.defaultMessage).to.equal('情景模拟');

    expect(select.id).to.be.a('string');
    expect(select.defaultMessage).to.equal('请选择情景');

    expect(button.id).to.be.a('string');
    expect(button.defaultMessage).to.equal('开始模拟');
  });

  it('should save to file', () => {
    transformFileSync('fixture.js', options);

    const output = readFileSync('./build/fixture.json', 'utf8');
    JSON.parse(output).forEach((item, index) => {
      expect(item.id).to.be.a('string');
      expect(item.defaultMessage).to.equal(defaultMessages[index]);
    });
  });
});
