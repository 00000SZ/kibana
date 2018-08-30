/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import Boom from 'boom';

import { DocumentSearchRequest, RepositorySearchRequest, SymbolSearchRequest } from '../../model';
import { Server } from '../kibana_types';
import { DocumentSearchClient, RepositorySearchClient, SymbolSearchClient } from '../search';

export function repositorySearchRoute(server: Server, repoSearchClient: RepositorySearchClient) {
  server.route({
    path: '/api/cs/search/repo',
    method: 'GET',
    async handler(req, reply) {
      let page = 1;
      if (req.query.p) {
        page = parseInt(req.query.p, 10);
      }
      const searchReq: RepositorySearchRequest = {
        query: req.query.q,
        page,
      };
      try {
        const res = await repoSearchClient.search(searchReq);
        reply(res);
      } catch (error) {
        reply(Boom.internal(`Search Exception ${error}`));
      }
    },
  });
}

export function documentSearchRoute(server: Server, docSearchClient: DocumentSearchClient) {
  server.route({
    path: '/api/cs/search/doc',
    method: 'GET',
    async handler(req, reply) {
      let page = 1;
      if (req.query.p) {
        page = parseInt(req.query.p, 10);
      }
      const searchReq: DocumentSearchRequest = {
        query: req.query.q,
        page,
        langFilters: req.query.langs ? req.query.langs.split(',') : [],
        repoFileters: req.query.repos ? decodeURIComponent(req.query.repos).split(',') : [],
      };
      try {
        const res = await docSearchClient.search(searchReq);
        reply(res);
      } catch (error) {
        reply(Boom.internal(`Search Exception ${error}`));
      }
    },
  });
}

export function symbolSearchRoute(server: Server, symbolSearchClient: SymbolSearchClient) {
  server.route({
    path: '/api/cs/search/symbol',
    method: 'GET',
    async handler(req, reply) {
      let page = 1;
      if (req.query.p) {
        page = parseInt(req.query.p, 10);
      }
      const searchReq: SymbolSearchRequest = {
        query: req.query.q,
        page,
      };
      try {
        const res = await symbolSearchClient.search(searchReq);
        reply(res);
      } catch (error) {
        reply(Boom.internal(`Search Exception ${error}`));
      }
    },
  });
}
