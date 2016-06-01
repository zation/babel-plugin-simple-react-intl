import p from 'path';
import { writeFileSync } from 'fs';
import { sync as mkdirpSync } from 'mkdirp';
import printICUMessage from './print-icu-message';

const FUNCTION_NAMES = [
  'defineMessages',
];

const DESCRIPTOR_PROPS = new Set(['id', 'description', 'defaultMessage']);

export default function() {
  function getModuleSourceName(opts) {
    return opts.moduleSourceName || 'react-intl';
  }

  function getMessageDescriptorKey(path) {
    if (path.isIdentifier() || path.isJSXIdentifier()) {
      return path.node.name;
    }

    let evaluated = path.evaluate();
    if (evaluated.confident) {
      return evaluated.value;
    }

    throw path.buildCodeFrameError(
      '[React Intl] Messages must be statically evaluate-able for extraction.'
    );
  }

  function getMessageDescriptorValue(path) {
    if (path.isJSXExpressionContainer()) {
      path = path.get('expression');
    }

    let evaluated = path.evaluate();
    if (evaluated.confident) {
      return evaluated.value;
    }

    throw path.buildCodeFrameError(
      '[React Intl] Messages must be statically evaluate-able for extraction.'
    );
  }

  function createMessageDescriptor(propPaths) {
    return propPaths.reduce((hash, [keyPath, valuePath]) => {
      let key = getMessageDescriptorKey(keyPath);

      if (!DESCRIPTOR_PROPS.has(key)) {
        return hash;
      }

      let value = getMessageDescriptorValue(valuePath).trim();

      if (key === 'defaultMessage') {
        try {
          hash[key] = printICUMessage(value);
        } catch (parseError) {
          throw valuePath.buildCodeFrameError(
            '[React Intl] Message failed to parse. ' +
            'See: http://formatjs.io/guides/message-syntax/',
            parseError
          );
        }
      } else {
        hash[key] = value;
      }

      return hash;
    }, {});
  }

  function storeMessage({ id, description, defaultMessage }, path, state) {
    const { opts, reactIntl } = state;

    if (!(id && defaultMessage)) {
      throw path.buildCodeFrameError(
        '[React Intl] Message Descriptors require an `id` and `defaultMessage`.'
      );
    }

    if (reactIntl.messages.has(id)) {
      let existing = reactIntl.messages.get(id);

      if (description !== existing.description ||
        defaultMessage !== existing.defaultMessage) {

        throw path.buildCodeFrameError(
          `[React Intl] Duplicate message id: "${id}", ` +
          'but the `description` and/or `defaultMessage` are different.'
        );
      }
    }

    if (opts.enforceDescriptions && !description) {
      throw path.buildCodeFrameError(
        '[React Intl] Message must have a `description`.'
      );
    }

    reactIntl.messages.set(id, { id, description, defaultMessage });
  }

  function referencesImport(path, mod, importedNames) {
    if (!(path.isIdentifier() || path.isJSXIdentifier())) {
      return false;
    }

    return importedNames.some((name) => path.referencesImport(mod, name));
  }

  return {
    visitor: {
      Program: {
        enter(path, state) {
          state.reactIntl = {
            messages: new Map(),
          };
        },

        exit(path, state) {
          const { file, opts, reactIntl } = state;
          const { basename, filename }    = file.opts;

          let descriptors = [...reactIntl.messages.values()];
          file.metadata['react-intl'] = { messages: descriptors };

          if (opts.messagesDir && descriptors.length > 0) {
            // Make sure the relative path is "absolute" before
            // joining it with the `messagesDir`.
            let relativePath = p.join(
              p.sep,
              p.relative(process.cwd(), filename)
            );

            let messagesFilename = p.join(
              opts.messagesDir,
              p.dirname(relativePath),
              basename + '.json'
            );

            let messagesFile = JSON.stringify(descriptors, null, 2);

            mkdirpSync(p.dirname(messagesFilename));
            writeFileSync(messagesFilename, messagesFile);
          }
        },
      },

      CallExpression(path, state) {
        const moduleSourceName = getModuleSourceName(state.opts);
        const callee = path.get('callee');

        function assertObjectExpression(node) {
          if (!(node && node.isObjectExpression())) {
            throw path.buildCodeFrameError(
              `[React Intl] \`${callee.node.name}()\` must be ` +
              'called with an object expression with values ' +
              'that are React Intl Message Descriptors, also ' +
              'defined as object expressions.'
            );
          }
        }

        function processMessageObject(messageObj) {
          assertObjectExpression(messageObj);

          let properties = messageObj.get('properties');

          let descriptor = createMessageDescriptor(
            properties.map((prop) => [
              prop.get('key'),
              prop.get('value'),
            ])
          );

          if (!descriptor.defaultMessage) {
            throw path.buildCodeFrameError(
              '[React Intl] Message is missing a `defaultMessage`.'
            );
          }

          storeMessage(descriptor, path, state);
        }

        if (referencesImport(callee, moduleSourceName, FUNCTION_NAMES)) {
          let messagesObj = path.get('arguments')[0];

          assertObjectExpression(messagesObj);

          messagesObj.get('properties')
            .map((prop) => prop.get('value'))
            .forEach(processMessageObject);
        }
      },
    },
  };
}
