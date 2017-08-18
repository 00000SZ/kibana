import Fn from '../fn.js';

export default new Fn({
  name: 'sleep',
  help: 'Introduces a delay to expressions. This should not be used in production. If you need this, you did something wrong',
  args: {
    _: {
      types: [
        'number',
      ],
      default: 0,
      'aliases': [],
      'multi': false, // TODO: No reason you couldn't.
      help: 'The number of milliseconds to wait',
    },
  },
  fn: (context, args) => {
    return new Promise(function (resolve) {
      setTimeout(() => resolve(context), args._);
    });
  },
});
