/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { createSelector } from 'reselect';
import { getLayerList } from "./map_selectors";
import { LAYER_TYPE } from "../shared/layers/layer";
import * as ol from 'openlayers';
import _ from 'lodash';

const FEATURE_PROJECTION = 'EPSG:3857';

// Layer-specific logic
function convertTmsLayersToOl({ source, visible }) {
  const tileLayer = new ol.layer.Tile({
    source: new ol.source.XYZ({
      url: source
    })
  });
  tileLayer.setVisible(visible);
  return tileLayer;
}

const convertVectorLayersToOl = (() => {
  const geojsonFormat = new ol.format.GeoJSON({
    featureProjection: FEATURE_PROJECTION
  });
  return ({ source, visible }) => {
    const olFeatures = geojsonFormat.readFeatures(source);
    const vectorLayer = new ol.layer.Vector({
      source: new ol.source.Vector({
        features: olFeatures
      })
    });
    vectorLayer.setVisible(visible);
    return vectorLayer;
  };
})();

function convertLayersByType(layerList) {
  return layerList.map(layer => {
    switch (layer.type) {
      case LAYER_TYPE.TILE:
        layer.olLayer = convertTmsLayersToOl(layer);
        break;
      case LAYER_TYPE.VECTOR:
        layer.olLayer = convertVectorLayersToOl(layer);
        break;
      default:
        break;
    }
    return layer;
  });
}

// Selectors
export function getOlLayers(state) {
  return createSelector(
    getLayerList,
    layerList => convertLayersByType(layerList)
  )(state);
}
export function getOlLayersBySource(state) {
  return createSelector(
    getOlLayers,
    layers => _.groupBy(layers, ({ appData }) => appData.source)
  )(state);
}

export function getOlLayersByType(state) {
  return createSelector(
    getOlLayers,
    layers => _.groupBy(layers, ({ appData }) => appData.layerType)
  )(state);
}
