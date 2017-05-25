import React from 'react';
import PropTypes from 'prop-types';

export function statefulProp(fieldname, updater = 'updateValue') {
  return (Comp) => {
    class WrappedControlledInput extends React.PureComponent {
      constructor(props) {
        super(props);

        this.state = {
          value: props[fieldname],
        };
      }

      componentWillReceiveProps(nextProps) {
        this.setState({ value: nextProps[fieldname] });
      }

      handleChange = (ev) => {
        if (ev.target) this.setState({ value: ev.target.value });
        else this.setState({ value: ev });
      }

      render() {
        const passedProps = {
          ...this.props,
          [fieldname]: this.state.value,
          [updater]: this.handleChange,
        };

        return (<Comp { ...passedProps } />);
      }
    }

    WrappedControlledInput.propTypes = {
      [fieldname]: PropTypes.string,
    };

    return WrappedControlledInput;
  };
}
