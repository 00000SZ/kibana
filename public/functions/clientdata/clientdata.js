import _ from 'lodash';
import Fn from '../../../common/functions/fn.js';
import cheap from './cheap.json';

export default new Fn({
  name: 'clientdata',
  aliases: [],
  type: 'datatable',
  help: 'Returns some crappy demo data',
  context: {},
  args: {},
  fn: () => {
    return {
      type: 'datatable',
      columns: [
        { name: '_rowId', type: 'number' },
        { name: 'time', type: 'date' },
        { name: 'cost', type: 'number' },
        { name: 'username', type: 'string' },
        { name: 'price', type: 'number' },
        { name: 'age', type: 'number' },
        { name: 'country', type: 'string' },
      ],
      rows: _.cloneDeep(cheap),
    };
  },
});
