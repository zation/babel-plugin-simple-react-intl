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

export default ({ types: t }) => ({
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
          defaultMessage: messagesObject[key],
          file: relativePath,
          key,
        }));

        mkdirpSync(dir);
        writeFileSync(filePath, JSON.stringify(messages, null, 2));

        path.get('arguments')[0].get('properties').forEach((property, index) => {
          property.node.value = t.objectExpression([
            t.objectProperty(
              t.identifier('id'),
              t.binaryExpression(
                '+',
                t.identifier('module.id'),
                t.stringLiteral(`-${property.node.key.name}`)
              )
            ),
            t.objectProperty(
              t.identifier('defaultMessage'),
              t.stringLiteral(messages[index].defaultMessage)
            ),
          ]);
        });
      }
    },
  },
});
