import Type from '../type';
import datatable from '../datatable';

export default new Type({
  name: 'pointseries',
  from: {
    null: () => {
      return {
        type: 'pointseries',
        rows: [],
        columns: [],
      };
    },
  },
  to: {
    render: (pointseries) => {
      return {
        type: 'render',
        as: 'table',
        value: datatable.from(pointseries),
      };
    },
  },
});
