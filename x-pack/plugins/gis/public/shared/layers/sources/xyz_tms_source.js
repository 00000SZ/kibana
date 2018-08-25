/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React, { Fragment } from 'react';

import {
  EuiFieldText,
  EuiButton
} from '@elastic/eui';

import { TMSSource } from './source';
import { TileLayer } from '../tile_layer';

export class XYZTMSSource extends TMSSource {

  static type = 'EMS_XYZ';

  static createDescriptor(urlTemplate) {
    return {
      type: XYZTMSSource.type,
      urlTemplate: urlTemplate
    };
  }

  static renderEditor({  onPreviewSource }) {
    const previewTMS = (urlTemplate) => {
      const sourceDescriptor = XYZTMSSource.createDescriptor(urlTemplate);
      const source = new XYZTMSSource(sourceDescriptor);
      onPreviewSource(source);
    };
    return (<XYZTMSEditor previewTMS={previewTMS} />);
  }

  renderDetails() {
    return (
      <Fragment>
        <div>
          <span className="bold">Type: </span><span>Tile (todo, use icon)</span>
        </div>
        <div>
          <span className="bold">Url: </span><span>{this._descriptor.urlTemplate}</span>
        </div>
      </Fragment>
    );
  }

  async createDefaultLayerDescriptor(options) {
    return TileLayer.createDescriptor({
      sourceDescriptor: this._descriptor,
      ...options
    });
  }

  getDisplayName() {
    return this._descriptor.urlTemplate;
  }

  getUrlTemplate() {
    return this._descriptor.urlTemplate;
  }
}


class XYZTMSEditor extends  React.Component {

  constructor() {
    super();
    this.state = {
      tmsInput: '',
      tmsCanPreview: false
    };
  }

  _handleTMSInputChange(e) {
    this.setState({
      tmsInput: e.target.value,
      tmsCanPreview: (e.target.value.indexOf('{x}') >= 0 && e.target.value.indexOf('{y}') >= 0 && e.target.value.indexOf('{z}') >= 0)
    });
  }

  render() {
    return (
      <Fragment>
        <EuiFieldText
          placeholder="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
          onChange={(e) => this._handleTMSInputChange(e)}
          aria-label="Use aria labels when no actual label is in use"
        />
        <EuiButton
          size="s"
          onClick={() => this.props.previewTMS(this.state.tmsInput)}
          isDisabled={!this.state.tmsCanPreview}
        >
          {this.state.tmsCanPreview ? "Preview on Map" : "Enter URL with {x}/{y}/{x} pattern." }
        </EuiButton>
      </Fragment>
    );
  }
}
