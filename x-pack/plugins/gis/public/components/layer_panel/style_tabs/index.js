/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { connect } from 'react-redux';
import { StyleTabs } from './view';
import { updateLayerStyle, clearTemporaryStyles } from '../../../actions/style_actions';

function mapDispatchToProps(dispatch) {
  return {
    updateStyle: styleDescriptor => {
      dispatch(updateLayerStyle(styleDescriptor));
    },
    reset: () => dispatch(clearTemporaryStyles())
  };
}

function mapStateToProps({}, props) {
  return {
    layer: props.layer
  };
}

const connectedFlyoutBody = connect(mapStateToProps, mapDispatchToProps)(StyleTabs);
export { connectedFlyoutBody as StyleTabs };
