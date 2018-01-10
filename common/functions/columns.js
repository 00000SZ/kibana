import { omit, pick, find } from 'lodash';

export const columns = {
  name: 'columns',
  type: 'datatable',
  help:
    'Include or exclude columns from a data table. If you specify both, this will exclude first',
  context: {
    types: ['datatable'],
  },
  args: {
    include: {
      types: ['string'],
      help: 'A comma seperated list of column names to keep in the table',
      default: null,
    },
    exclude: {
      types: ['string'],
      help: 'A comma seperated list of column names to remove from the table',
      default: null,
    },
  },
  fn: (context, args) => {
    const { include, exclude } = args;

    let result = { ...context };

    if (exclude) {
      const fields = exclude.split(',').map(field => field.trim());
      const rows = result.rows.map(row => omit(row, fields));
      const columns = result.columns.filter(col => !fields.includes(col.name));
      result = { ...result, rows, columns };
    }

    if (include) {
      const fields = include.split(',').map(field => field.trim());
      const rows = result.rows.map(row => pick(row, fields));
      //const columns = result.columns.filter(col => fields.includes(col.name));
      // Include columns in the order the user specified
      const columns = [];
      fields.forEach(field => {
        const column = find(result.columns, { name: field });
        if (column) columns.push(column);
      });
      result = { ...result, rows, columns };
    }

    return result;
  },
};
