/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */


import { ESTableSource } from '../sources/es_table_source';

export class LeftInnerJoin {

  static toHash(descriptor) {
    return JSON.stringify(descriptor);
  }

  constructor(joinDescriptor) {
    this._descriptor = joinDescriptor;
    this._rightSource = new ESTableSource(joinDescriptor.right);
  }

  displayHash() {
    return LeftInnerJoin.toHash(this._descriptor);
  }

  getSourceId() {
    return `join:${this.displayHash()}`;
  }

  joinTableToFeatureCollection(featureCollection, table) {
    console.log('must join', featureCollection, table);
    const newField = `__kbn__join_${this.getSourceId()}`;
    //todo: poor man's join with nested loop
    for (let i = 0; i < featureCollection.features.length; i++) {
      const feature = featureCollection.features[i];
      feature.properties[newField] = null;//wipe
      const joinFieldValue = feature.properties[this._descriptor.leftField];
      for (let j = 0; j < table.length; j++) {
        if (table[j].key === joinFieldValue) {
          feature.properties[newField] = table[j].value;
        }
      }
    }
  }

  getTableSource() {
    return this._rightSource;
  }

  getId() {
    return this._descriptor.id;
  }

}

