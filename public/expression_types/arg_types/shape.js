import React from 'react';
import PropTypes from 'prop-types';
import { ShapePicker } from '../../components/shape_picker/shape_picker';
import { templateFromReactComponent } from '../../lib/template_from_react_component';

const ShapeArgInput = ({ argValue, onValueChange }) => {
  const onChange = val => onValueChange(val);

  return (
    <div className="canvas__argtype--shape-simple">
      <ShapePicker value={argValue} onSelect={onChange} />
    </div>
  );
};

ShapeArgInput.propTypes = {
  argValue: PropTypes.string,
  onValueChange: PropTypes.func,
};

export const shape = () => ({
  name: 'shape',
  displayName: 'Shape',
  help: 'Shape selector',
  default: 'circle',
  simpleTemplate: templateFromReactComponent(ShapeArgInput),
});
