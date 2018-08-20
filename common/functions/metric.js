import { openSans } from '../lib/fonts';
export const metric = () => ({
  name: 'metric',
  aliases: [],
  type: 'render',
  help: 'A number with a label',
  context: {
    types: ['string', 'null'],
  },
  args: {
    _: {
      types: ['string'],
      alias: ['label', 'text', 'description'],
      help: 'Text describing the metric',
      default: '""',
    },
    metricFont: {
      types: ['style'],
      help: 'Font settings for the metric. Technically you can stick other styles in here too!',
      default: `{font size=48 family="${openSans.value}" color="#000000" align=center lHeight=48}`,
    },
    labelFont: {
      types: ['style'],
      help: 'Font settings for the label. Technically you can stick other styles in here too!',
      default: `{font size=14 family="${openSans.value}" color="#000000" align=center}`,
    },
  },
  fn: (context, { _, metricFont, labelFont }) => {
    return {
      type: 'render',
      as: 'metric',
      value: {
        metric: context === null ? '?' : context,
        label: _,
        metricFont,
        labelFont,
      },
    };
  },
});
