/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

export const REPOSITORY_INDEX_TYPE = 'codesearch-repository';
export const REPOSITORY_CLONE_STATUS_INDEX_TYPE = 'codesearch-repository-clone-status';
export const REPOSITORY_DELETE_STATUS_INDEX_TYPE = 'codesearch-repository-delete-status';
export const REPOSITORY_LSP_INDEX_STATUS_INDEX_TYPE = 'codesearch-repository-lsp-index-status';
export const REPOSITORY_INDEX_STATUS_INDEX_TYPE = 'codesearch-repository-index-status';

export const mappings = {
  [REPOSITORY_INDEX_TYPE]: {
    properties: {
      uri: {
        type: 'text',
      },
      url: {
        type: 'text',
      },
      name: {
        type: 'text',
      },
      org: {
        type: 'text',
      },
    },
  },
  [REPOSITORY_CLONE_STATUS_INDEX_TYPE]: {
    properties: {
      uri: {
        type: 'text',
      },
      progress: {
        type: 'integer',
      },
      timestamp: {
        type: 'date',
      },
    },
  },
  [REPOSITORY_DELETE_STATUS_INDEX_TYPE]: {
    properties: {
      uri: {
        type: 'text',
      },
      progress: {
        type: 'integer',
      },
      timestamp: {
        type: 'date',
      },
    },
  },
  [REPOSITORY_LSP_INDEX_STATUS_INDEX_TYPE]: {
    properties: {
      uri: {
        type: 'text',
      },
      progress: {
        type: 'integer',
      },
      timestamp: {
        type: 'date',
      },
    },
  },
  [REPOSITORY_INDEX_STATUS_INDEX_TYPE]: {
    properties: {
      uri: {
        type: 'text',
      },
      progress: {
        type: 'integer',
      },
      timestamp: {
        type: 'date',
      },
    },
  },
};
