/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { EsClient } from '@codesearch/esqueue';

import { Repository, RepositorySearchRequest, RepositorySearchResult } from '../../model';
import { RepositoryIndexName } from '../indexer/schema';
import { Log } from '../log';
import { AbstractSearchClient } from './abstract_search_client';

export class RepositorySearchClient extends AbstractSearchClient {
  constructor(protected readonly client: EsClient, protected readonly log: Log) {
    super(client, log);
  }

  public async search(req: RepositorySearchRequest): Promise<RepositorySearchResult> {
    const from = (req.page - 1) * req.resultsPerPage;
    const size = req.resultsPerPage;
    const rawRes = await this.client.search({
      index: RepositoryIndexName(),
      body: {
        from,
        size,
        query: {
          bool: {
            should: [
              {
                simple_query_string: {
                  query: req.query,
                  fields: ['name^1.0', 'org^1.0'],
                  default_operator: 'or',
                  lenient: false,
                  analyze_wildcard: false,
                  boost: 1.0,
                },
              },
              // This prefix query is mostly for typeahead search.
              {
                prefix: {
                  name: {
                    value: req.query,
                    boost: 100.0,
                  },
                },
              },
            ],
            disable_coord: false,
            adjust_pure_negative: true,
            boost: 1.0,
          },
        },
      },
    });

    const hits: any[] = rawRes.hits.hits;
    const repos: Repository[] = hits.map(hit => {
      const repo: Repository = hit._source;
      return repo;
    });
    const result: RepositorySearchResult = {
      repositories: repos,
      took: rawRes.took,
      total: rawRes.hits.total,
    };
    return result;
  }
}
