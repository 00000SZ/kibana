import { View } from '../view';
import { Arg } from '../arg';

export const markdown = () => new View('markdown', {
  displayName: 'Markdown',
  description: 'Generate markup using markdown',
  modelArgs: [],
  requiresContext: false,
  args: [
    new Arg('_', {
      displayName: 'Markdown content',
      argType: 'textarea',
      options: {
        confirm: 'Apply',
      },
    }),
  ],
});
