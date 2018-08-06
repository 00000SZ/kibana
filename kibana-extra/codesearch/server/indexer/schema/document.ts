/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { RepositoryUtils } from '../../../common/repository_utils';
import { RepositoryUri } from '../../../model';

// Coorespond to model/search/Document
export const DocumentSchema = {
  repoUri: {
    type: 'text',
    index: false,
    norms: false,
  },
  path: {
    type: 'text',
    analyzer: 'path_analyzer',
    fields: {
      hierarchy: {
        type: 'text',
        analyzer: 'path_hierarchy_analyzer',
      },
    },
  },
  content: {
    type: 'text',
    analyzer: 'content_analyzer',
  },
  qnames: {
    type: 'text',
    analyzer: 'qname_path_hierarchy_analyzer',
  },
  language: {
    type: 'text',
    index: false,
    norms: false,
  },
  sha1: {
    type: 'text',
    index: false,
    norms: false,
  },
};

export const DocumentAnalysisSettings = {
  analysis: {
    analyzer: {
      content_analyzer: {
        tokenizer: 'standard',
        char_filter: ['content_char_filter'],
        filter: ['lowercase'],
      },
      lowercase_analyzer: {
        type: 'custom',
        filter: ['lowercase'],
        tokenizer: 'keyword',
      },
      path_analyzer: {
        type: 'custom',
        filter: ['lowercase'],
        tokenizer: 'path_tokenizer',
      },
      path_hierarchy_analyzer: {
        type: 'custom',
        tokenizer: 'path_hierarchy_tokenizer',
        filter: ['lowercase'],
      },
      qname_path_hierarchy_analyzer: {
        type: 'custom',
        tokenizer: 'qname_path_hierarchy_tokenizer',
        filter: ['lowercase'],
      },
    },
    char_filter: {
      content_char_filter: {
        type: 'pattern_replace',
        pattern: '[.]',
        replacement: ' ',
      },
    },
    tokenizer: {
      path_tokenizer: {
        type: 'pattern',
        pattern: '[\\\\./]',
      },
      qname_path_hierarchy_tokenizer: {
        type: 'path_hierarchy',
        delimiter: '.',
        reverse: 'true',
      },
      path_hierarchy_tokenizer: {
        type: 'path_hierarchy',
        delimiter: '/',
        reverse: 'true',
      },
    },
  },
};

export const DocumentTypeName = 'document';
export const DocumentIndexNamePrefix = `.codesearch-${DocumentTypeName}`;
export const DocumentIndexName = (repoUri: RepositoryUri) => {
  return `${DocumentIndexNamePrefix}-${RepositoryUtils.normalizeRepoUriToIndexName(repoUri)}`;
};
