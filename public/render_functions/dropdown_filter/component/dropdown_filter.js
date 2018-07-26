import React from 'react';
import PropTypes from 'prop-types';
import { FormControl } from 'react-bootstrap';

export const DropdownFilter = ({ value, onChange, commit, choices }) => {
  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        commit(value);
      }}
      className="canvasDropdownFilter"
    >
      <FormControl
        className="canvasDropdownFilter--input"
        componentClass="select"
        placeholder="select"
        value={value}
        onChange={e => {
          onChange(e.target.value);
          commit(e.target.value);
        }}
      >
        <option value="%%CANVAS_MATCH_ALL%%">-- ANY --</option>
        {choices.map(value => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </FormControl>
    </form>
  );
};

DropdownFilter.propTypes = {
  onChange: PropTypes.func,
  value: PropTypes.string,
  commit: PropTypes.func,
  choices: PropTypes.array,
};
