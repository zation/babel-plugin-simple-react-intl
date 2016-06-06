const FUNCTION_NAME = [
  'defineMessages',
  'default',
];

export default ({ types: t }) => ({
  visitor: {
    CallExpression: (path, state) => {
      const moduleSourceName = state.opts.moduleSourceName || 'react-intl';
      const callee = path.get('callee');

      if (
        callee.isIdentifier() &&
        FUNCTION_NAME.some(name => callee.referencesImport(moduleSourceName, name))
      ) {
        path.get('arguments')[0].get('properties').forEach(property => {
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
              t.stringLiteral(property.node.value.value)
            ),
          ]);
        });
      }
    },
  },
});
