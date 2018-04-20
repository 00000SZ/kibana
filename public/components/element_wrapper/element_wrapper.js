import React from 'react';
import PropTypes from 'prop-types';
import { Positionable } from '../positionable';
import { ElementControls } from './element_controls';
import './element_wrapper.less';

export const ElementWrapper = props => {
  const {
    selectElement,
    removeElement,
    isSelected,
    renderable,
    position,
    setPosition,
    state,
    handlers,
  } = props;

  return (
    <Positionable position={position} onChange={setPosition} interact={isSelected}>
      {/*
        This is why we need this janky ElementControls thing:

        Size will be passed to PositionableChild by Positionable
        size={{ width: position.width, height: position.height }}

        This keeps things fast, allowing Positionable to maintain a cache of the state without
        writing it back to redux.

        Its crap, I agree. I'm open to better solutions.
      */}
      <ElementControls
        selectElement={selectElement}
        removeElement={removeElement}
        isSelected={isSelected}
        renderable={renderable}
        state={state}
        handlers={handlers}
      />
    </Positionable>
  );
};

ElementWrapper.propTypes = {
  selectElement: PropTypes.func,
  removeElement: PropTypes.func,
  isSelected: PropTypes.bool,
  state: PropTypes.string,
  error: PropTypes.object,
  renderable: PropTypes.object,
  position: PropTypes.object,
  setPosition: PropTypes.func,
  handlers: PropTypes.object,
};
