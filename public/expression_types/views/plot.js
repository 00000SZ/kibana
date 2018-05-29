import { map, uniq } from 'lodash';
import { getState, getValue } from '../../lib/resolved_arg';

const styleProps = ['lines', 'bars', 'points', 'fill', 'stack'];

export const plot = () => ({
  name: 'plot',
  displayName: 'Chart Style',
  modelArgs: ['x', 'y', 'color', 'size', 'text'],
  args: [
    {
      name: 'palette',
      displayName: 'Color palette',
      argType: 'palette',
    },
    {
      name: 'legend',
      displayName: 'Legend Visibility',
      help: 'Enable or disable the legend',
      argType: 'toggle',
      default: 'true',
    },
    {
      name: 'xaxis',
      displayName: 'X-Axis',
      help: 'Configure or disable the x-axis',
      argType: 'axisConfig',
      default: true,
    },
    {
      name: 'yaxis',
      displayName: 'Y-Axis',
      help: 'Configure or disable the Y-axis',
      argType: 'axisConfig',
      default: true,
    },
    {
      name: 'font',
      displayName: 'Text settings',
      help: 'Fonts, alignment and color',
      argType: 'font',
    },
    {
      name: 'defaultStyle',
      displayName: 'Default style',
      help: 'Set the style to be used by default by every series, unless overridden.',
      argType: 'seriesStyle',
      default: '{seriesStyle points=5}',
      options: {
        include: styleProps,
      },
    },
    {
      name: 'seriesStyle',
      displayName: 'Series style',
      help: 'Set color, select line sizes, and more. Expand to select the series you want to style',
      argType: 'seriesStyle',
      default: '{seriesStyle points=5}',
      options: {
        include: styleProps,
      },
      multi: true,
    },
  ],
  resolve({ context }) {
    if (getState(context) !== 'ready') return { labels: [] };
    return { labels: uniq(map(getValue(context).rows, 'color').filter(v => v !== undefined)) };
  },
});
