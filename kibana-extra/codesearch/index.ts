/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { Esqueue } from '@codesearch/esqueue';
import { resolve } from 'path';

import { mappings } from './mappings';
import { LspIndexer, RepositoryIndexInitializer } from './server/indexer';
import { Server } from './server/kibana_types';
import { Log } from './server/log';
import { LspService } from './server/lsp/lsp_service';
import { CloneWorker, DeleteWorker, IndexWorker, UpdateWorker } from './server/queue';
import { fileRoute } from './server/routes/file';
import { lspRoute } from './server/routes/lsp';
import { monacoRoute } from './server/routes/monaco';
import { repositoryRoute } from './server/routes/repository';
import {
  documentSearchRoute,
  repositorySearchRoute,
  symbolSearchRoute,
} from './server/routes/search';
import { DocumentSearchClient, RepositorySearchClient, SymbolSearchClient } from './server/search';
import { ServerOptions } from './server/server_options';
import { UpdateScheduler } from './server/update_scheduler';

// tslint:disable-next-line no-default-export
export default (kibana: any) =>
  new kibana.Plugin({
    require: ['elasticsearch'],
    name: 'codesearch',
    publicDir: resolve(__dirname, 'public'),
    uiExports: {
      app: {
        title: 'Code Search',
        description: 'Code Search Plugin',
        main: 'plugins/codesearch/app',
        styleSheetPath: resolve(__dirname, 'public/styles.scss'),
      },

      hacks: ['plugins/codesearch/hack'],

      mappings,
    },

    config(Joi: any) {
      return Joi.object({
        enabled: Joi.boolean().default(true),
        queueIndex: Joi.string().default('.codesearch-worker-queue'),
        queueTimeout: Joi.number().default(60 * 60 * 1000), // 1 hour by default
        updateFreqencyMs: Joi.number().default(5 * 60 * 1000), // 5 minutes by default.
        lspRequestTimeout: Joi.number().default(5 * 60), // timeout a request over 30s
      }).default();
    },

    init(server: Server, options: any) {
      const queueIndex = server.config().get('codesearch.queueIndex');
      const queueTimeout = server.config().get('codesearch.queueTimeout');
      const adminCluster = server.plugins.elasticsearch.getCluster('admin');
      const dataCluster = server.plugins.elasticsearch.getCluster('data');
      const log = new Log(server);
      const serverOptions = new ServerOptions(options, server.config());

      // Initialize search clients
      const repoSearchClient = new RepositorySearchClient(dataCluster.getClient(), log);
      const documentSearchClient = new DocumentSearchClient(dataCluster.getClient(), log);
      const symbolSearchClient = new SymbolSearchClient(dataCluster.getClient(), log);

      // Initialize indexers
      const lspService = new LspService('127.0.0.1', server, serverOptions);
      const lspIndexer = new LspIndexer(lspService, serverOptions, adminCluster.getClient(), log);

      // Initialize repository index.
      const repositoryIndexInit = new RepositoryIndexInitializer(adminCluster.getClient(), log);

      // Initialize queue.
      const repository = server.savedObjects.getSavedObjectsRepository(
        adminCluster.callWithInternalUser
      );
      const objectsClient = new server.savedObjects.SavedObjectsClient(repository);
      const queue = new Esqueue(queueIndex, {
        client: adminCluster.getClient(),
        timeout: queueTimeout,
        doctype: 'esqueue',
      });
      const cloneWorker = new CloneWorker(queue, log, objectsClient).bind();
      const deleteWorker = new DeleteWorker(
        queue,
        log,
        objectsClient,
        adminCluster.getClient()
      ).bind();
      const updateWorker = new UpdateWorker(queue, log, objectsClient).bind();
      const indexWorker = new IndexWorker(queue, log, objectsClient, [lspIndexer]).bind();

      // Initialize scheduler.
      const scheduler = new UpdateScheduler(
        updateWorker,
        serverOptions,
        adminCluster.callWithInternalUser
      );
      scheduler.start();

      // Add server routes and initialize the plugin here
      repositoryRoute(
        server,
        serverOptions,
        cloneWorker,
        deleteWorker,
        indexWorker,
        repositoryIndexInit
      );
      repositorySearchRoute(server, repoSearchClient);
      documentSearchRoute(server, documentSearchClient);
      symbolSearchRoute(server, symbolSearchClient);
      fileRoute(server, serverOptions);
      monacoRoute(server);

      lspService.launchServers().then(() => {
        // register lsp route after language server launched
        lspRoute(server, lspService, serverOptions);
      });
    },
  });
