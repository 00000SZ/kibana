/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React from 'react';

import { StyleTabs } from './style_tabs';
import { FlyoutFooter } from './flyout_footer';

import {
  EuiFlyout,
  EuiFlyoutBody,
  EuiHorizontalRule,
  EuiFlyoutHeader,
  EuiFlyoutFooter,
  EuiTitle,
  EuiSpacer,
} from '@elastic/eui';

export function LayerPanel({ selectedLayer, cancelLayerPanel }) {

  if (!selectedLayer) {
    //todo: temp placeholder to bypass state-bug
    return (<div />);
  }

  return (
    <EuiFlyout
      onClose={cancelLayerPanel}
      style={{ maxWidth: 768 }}
    >
      <EuiFlyoutHeader>
        <EuiTitle size="l">
          <h2>{selectedLayer.getDisplayName()}</h2>
        </EuiTitle>
        <EuiSpacer size="m"/>
        <EuiSpacer/>

        <div>
          {selectedLayer.renderSourceDetails()}
        </div>
        <EuiSpacer/>

        <EuiHorizontalRule margin="none"/>
      </EuiFlyoutHeader>

      <EuiFlyoutBody style={{ paddingTop: 0 }}>
        <EuiSpacer size="l"/>
        <StyleTabs layer={selectedLayer}/>
        <EuiSpacer size="l"/>
      </EuiFlyoutBody>

      <EuiFlyoutFooter>
        <FlyoutFooter/>
      </EuiFlyoutFooter>
    </EuiFlyout>
  );
}
