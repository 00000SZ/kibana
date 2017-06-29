import { pure, compose, withProps, withState } from 'recompose';
import { elements } from '../../../lib/elements';

import { ElementTypes as Component } from './element_types';

const elementTypesState = withState('search', 'setSearch');
const elementTypeProps = withProps(() => ({ elements: elements.toJS() }));

export const ElementTypes = compose(
  pure,
  elementTypesState,
  elementTypeProps
)(Component);
