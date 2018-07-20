import { map, uniq } from 'lodash';
import { getState, getValue } from '../../lib/resolved_arg';
import { legendOptions } from '../../lib/legend_options';

export const pie = () => ({
  name: 'pie',
  displayName: 'Chart Style',
  modelArgs: [['color', { label: 'Slice Labels' }], ['size', { label: 'Slice Angles' }]],
  args: [
    {
      name: 'palette',
      displayName: 'Color palette',
      argType: 'palette',
    },
    {
      name: 'hole',
      displayName: 'Inner Radius',
      help: 'Radius of the hole',
      argType: 'range',
      default: '50',
      min: 0,
      max: 100,
    },
    {
      name: 'labels',
      displayName: 'Labels',
      help: 'Show/hide labels',
      argType: 'toggle',
      default: true,
    },
    {
      name: 'labelRadius',
      displayName: 'Label Radius',
      help: 'Distance of the labels from the center of the pie',
      argType: 'range',
      default: '100',
      min: 0,
      max: 100,
    },
    {
      name: 'legend',
      displayName: 'Legend Position',
      help: 'Disable or position the legend',
      argType: 'select',
      default: 'ne',
      options: {
        choices: legendOptions,
      },
    },
    {
      name: 'radius',
      displayName: 'Radius',
      help: 'Radius of the pie',
      argType: 'percentage',
      default: '1',
      min: 0,
      max: 1,
    },
    {
      name: 'seriesStyle',
      displayName: 'Series Style',
      help: 'Set the color of a specific slice, expand to select series',
      argType: 'seriesStyle',
      default: '{seriesStyle}',
      multi: true,
    },
    {
      name: 'font',
      displayName: 'Text settings',
      help: 'Fonts, alignment and color',
      argType: 'font',
    },
    {
      name: 'tilt',
      displayName: 'Tilt Angle',
      help: 'Percentage of tilt where 1 is fully vertical and 0 is completely flat',
      argType: 'percentage',
      default: 1,
      min: 0,
      max: 1,
    },
  ],
  resolve({ context }) {
    if (getState(context) !== 'ready') return { labels: [] };
    return { labels: uniq(map(getValue(context).rows, 'color').filter(v => v !== undefined)) };
  },
});
