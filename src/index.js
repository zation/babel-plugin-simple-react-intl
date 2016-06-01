import p from 'path';
import { writeFileSync } from 'fs';
import { sync as mkdirpSync } from 'mkdirp';

const FUNCTION_NAME = [
  'defineMessages',
  'default',
];

const convertToObject = objectExpression => objectExpression.node.properties.reduce(
  (object, { key, value }) => ({ ...object, [key.name]: value.value }),
  {}
);

export default () => ({
  visitor: {
    CallExpression: (path, state) => {
      const { opts } = state;
      const moduleSourceName = opts.moduleSourceName || 'react-intl';
      const callee = path.get('callee');

      if (
        callee.isIdentifier() &&
        FUNCTION_NAME.some(name => callee.referencesImport(moduleSourceName, name))
      ) {

        const { file: { opts: { basename, filename } } } = state;
        const relativePath = p.relative(process.cwd(), filename);
        const dir = p.join(opts.messagesDir, p.dirname(relativePath));
        const filePath = p.format({
          dir,
          ext: '.json',
          base: `${basename}.json`,
          name: basename,
        });

        const messagesObject = convertToObject(path.get('arguments')[0]);
        const messages = Object.keys(messagesObject).map(key => ({
          id: `${relativePath}-${key}`,
          defaultMessage: messagesObject[key],
        }));

        mkdirpSync(dir);
        writeFileSync(filePath, JSON.stringify(messages, null, 2));
      }
    },
  },
});
