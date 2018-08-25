/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */
import React, { Fragment } from 'react';
import { TMSSource } from './source';
import { TileLayer } from '../tile_layer';

export class EMSTMSSource extends TMSSource {

  static type = 'EMS_TMS';

  static createDescriptor(serviceId) {
    return {
      type: EMSTMSSource.type,
      id: serviceId
    };
  }

  renderDetails() {
    return (
      <Fragment>
        <div>
          <span className="bold">Source: </span><span>Elastic Maps Service</span>
        </div>
        <div>
          <span className="bold">Type: </span><span>Tile (todo, use icon)</span>
        </div>
        <div>
          <span className="bold">Id: </span><span>{this._descriptor.id}</span>
        </div>
      </Fragment>
    );
  }

  _getTMSOptions(allServices) {
    return allServices.find(service => {
      return service.id === this._descriptor.id;
    });
  }

  _createDefaultLayerDescriptor(options) {
    return TileLayer.createDescriptor({
      sourceDescriptor: this._descriptor,
      ...options
    });
  }

  createDefaultLayer(options) {
    return new TileLayer({
      layerDescriptor: this._createDefaultLayerDescriptor(options),
      source: this
    });
  }

  getDisplayName() {
    return this._descriptor.id;
  }

  getUrlTemplate(dataSourceMeta) {
    const service = this._getTMSOptions(dataSourceMeta.ems.tms);
    return service.url;
  }


}
