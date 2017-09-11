import Fn from '../fn.js';
import { math } from '../../lib/math.js';
import { pivotObjectArray } from '../../lib/pivot_object_array.js';

export default new Fn({
  name: 'math',
  type: 'number',
  help: 'Interpret a mathJS expression, with a datatable as context, or not',
  context: {
    types: ['null', 'datatable'],
  },
  args: {
    _: {
      types: ['string'],
    },
  },
  fn: (context, args) => {
    const isDatatable = context && context.type === 'datatable';
    const mathContext = isDatatable ? pivotObjectArray(context.rows, context.columns) : null;
    const result = math.eval(args._, mathContext);
    if (typeof result !== 'number') throw new Error ('Failed to execute math expression. Check your column names');
    return result;
  },
});
