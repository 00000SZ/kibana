/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */
export class ALayer {

  constructor({ layerDescriptor, source }) {
    this._descriptor = layerDescriptor;
    this._source = source;
  }

  static createDescriptor(options) {
    const layerDescriptor = {};
    layerDescriptor.data = options.data || null;
    layerDescriptor.dataMeta = options.dataMeta || {};
    layerDescriptor.dataDirty = typeof options.dataDirty === 'boolean' ? options.dataDirty : false;
    layerDescriptor.id = Math.random().toString(36).substr(2, 5);
    layerDescriptor.source = options.source;
    layerDescriptor.sourceDescriptor = options.sourceDescriptor;
    layerDescriptor.visible = options.visible || true;
    layerDescriptor.temporary = options.temporary || false;
    layerDescriptor.style = options.style || {};
    return layerDescriptor;
  }

  getDisplayName() {
    return this._source.getDisplayName() || `Layer ${this._descriptor.id}`;
  }

  getId() {
    return this._descriptor.id;
  }

  getType() {
    return this._descriptor.type;
  }

  isVisible() {
    return this._descriptor.visible;
  }

  isTemporary() {
    return this._descriptor.temporary;
  }

  getSupportedStyles() {
    return [];
  }

  getCurrentStyle() {
    throw new Error('Style not implemented');
  }

  renderSourceDetails() {
    return this._source.renderDetails();
  }

  /**
   * this is a temp method, in progress of refactoring this.
   */
  _createCorrespondingOLLayer() {
    throw new Error('Should implement Layer#createCorrespondingOLLayer');
  }

  syncLayerWithOL(olMap) {
    const olLayerArray = olMap.getLayers().getArray();
    let olLayer = olLayerArray.find(olLayer => olLayer.get('id') === this.getId());
    if (!olLayer) {
      olLayer = this._createCorrespondingOLLayer();
    }
    olLayer.set('id', this.getId());
    olLayer.setVisible(this.isVisible());
    this._syncOLStyle(olLayer);
    this._syncOLData(olLayer);
    return olLayer;
  }

  _syncOLStyle() {
    //no-op by default
  }

  _syncOLData() {
    //no-op by default
  }

  isLayerLoading() {
    return false;
  }

  toLayerDescriptor() {
    return this._descriptor;
  }

  //temp method until decoupled data-loading starts to fall into place
  //but this will already allow us to do some refactors
  // (e.g. initialize with json, async layer-loading, ...)
  async initializeData() {
    return null;
  }

  syncDataToExtent() {
    //no-op by default
  }

}

