const Fn = require('../fn.js');

// seriesConfig(series=_all, label="free beer", width=1, color=blue)
module.exports = new Fn({
  name: 'containerStyle',
  aliases: [],
  type: 'containerStyle',
  help: 'Creates an object used for describing the properties of a series on a chart.' +
  ' You would usually use this inside of a charting function',
  args: {
    border: {
      types: ['string', 'null'],
      help: 'Valid CSS border string',
    },
    borderRadius: {
      types: ['number', 'null'],
      help: 'Number of pixels to use when rounding the border',
    },
    padding: {
      types: ['number', 'null'],
      help: 'Content distance in pixels from border',
    },
    background: {
      types: ['string', 'null'],
      help: 'Valid CSS background string',
    },
    opacity: {
      types: ['number', 'null'],
      help: 'A number between 0 and 1 representing the degree of transparency of the element',
    },
  },
  fn: (context, args) => {
    args.borderRadius = `${args.borderRadius}px`;
    args.padding = `${args.padding}px`;
    return { type: 'containerStyle', ...args };
  },
});
