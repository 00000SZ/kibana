import Fn from '../../../common/functions/fn.js';
//import { buildESRequest } from '../esdocs/lib/build_es_request';
import fetch from 'axios';
import { flatten, find } from 'lodash';
import { buildBoolArray } from '../esdocs/lib/build_bool_array';

export default new Fn({
  name: 'timelion',
  context: {
    types: ['filter'],
  },
  args: {
    q: {
      types: ['string'],
      aliases: ['query'],
      help: 'A timelion query',
      default: '.es(*)',
    },
    interval: {
      types: ['string'],
      help: 'Bucket interval for the time series',
      default: 'auto',
    },
    from: {
      type: ['string'],
      help: 'Elasticsearch date math string for the start of the time range',
    },
    to: {
      type: ['string'],
      help: 'Elasticsearch date math string for the end of the time range',
    },
  },
  type: 'datatable',
  help:
    'Use timelion to extract one or more timeseries from Elasticsearch and other backends. ' +
    'Note that styling related settings will not be preserved. Timelion requires a time range. ' +
    'You can use a timefilter element for this, or both the from/to parameters of this function',
  fn: (context, args, handlers) => {

    // TODO: Find time range, or just request a giant single bucket?
    function findTimeRangeInFilterContext() {
      const timeFilter = find(context.and, { type: 'time' });
      if (!timeFilter) throw new Error ('No time filter found');
      return { from: timeFilter.from, to: timeFilter.to };
    }

    const defaultRange = { from: args.from || 'now-1y', to: args.to || 'now' };

    let range;
    try {
      range = Object.assign({}, defaultRange, findTimeRangeInFilterContext());
    } catch(e) {
      range = Object.assign({}, defaultRange);
    }

    const body = {
      extended: {
        es: {
          filter: {
            bool: {
              must: buildBoolArray(context.and),
            },
          },
        },
      },
      sheet: [args.q],
      time: {
        from: range.from,
        to: range.to,
        interval: 'auto',
        timezone: 'America/Phoenix',
      },
    };

    return fetch(`${handlers.serverUri}/api/timelion/run`, {
      method: 'POST',
      responseType: 'json',
      headers: {
        'kbn-xsrf': 'lollerpops',
        ...handlers.httpHeaders,
      },
      data: body,
    }).then(resp => {

      const seriesList = resp.data.sheet[0].list;

      const rows = flatten(seriesList.map(series =>
        series.data.map(row => ({ '@timestamp': row[0], value: row[1], label: series.label }))
      ))
      .map((row, i) => ({ ...row, _rowId: i }));

      return {
        type: 'datatable',
        columns: [
          { name: '_rowId',     type: 'number'  },
          { name: '@timestamp', type: 'date'    },
          { name: 'value',      type: 'number'  },
          { name: 'label',      type: 'string'  },
        ],
        rows: rows,
      };
    });
  },
});
