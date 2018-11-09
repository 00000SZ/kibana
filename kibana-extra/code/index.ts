/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { Esqueue } from '@code/esqueue';
import moment from 'moment';
import { resolve } from 'path';

import { LspIndexerFactory, RepositoryIndexInitializerFactory } from './server/indexer';
import { Server } from './server/kibana_types';
import { Log } from './server/log';
import { LspService } from './server/lsp/lsp_service';
import {
  CancellationSerivce,
  CloneWorker,
  DeleteWorker,
  IndexWorker,
  UpdateWorker,
} from './server/queue';
import { fileRoute } from './server/routes/file';
import { lspRoute, symbolByQnameRoute } from './server/routes/lsp';
import { monacoRoute } from './server/routes/monaco';
import { repositoryRoute } from './server/routes/repository';
import {
  documentSearchRoute,
  repositorySearchRoute,
  symbolSearchRoute,
} from './server/routes/search';
import { socketRoute } from './server/routes/socket';
import { userRoute } from './server/routes/user';
import { workspaceRoute } from './server/routes/workspace';
import { IndexScheduler, UpdateScheduler } from './server/scheduler';
import { DocumentSearchClient, RepositorySearchClient, SymbolSearchClient } from './server/search';
import { ServerOptions } from './server/server_options';
import { SocketService } from './server/socket_service';
import { ServerLoggerFactory } from './server/utils/server_logger_factory';

// tslint:disable-next-line no-default-export
export default (kibana: any) =>
  new kibana.Plugin({
    require: ['elasticsearch'],
    name: 'code',
    publicDir: resolve(__dirname, 'public'),
    uiExports: {
      app: {
        title: 'Code',
        description: 'Code Search Plugin',
        main: 'plugins/code/app',
      },
      styleSheetPaths: resolve(__dirname, 'public/styles.scss'),
      hacks: ['plugins/code/hack'],
    },

    config(Joi: any) {
      return Joi.object({
        enabled: Joi.boolean().default(true),
        queueIndex: Joi.string().default('.code-worker-queue'),
        // 1 hour by default.
        queueTimeout: Joi.number().default(moment.duration(1, 'hour').asMilliseconds()),
        // The frequency which update scheduler executes. 5 minutes by default.
        updateFrequencyMs: Joi.number().default(moment.duration(5, 'minute').asMilliseconds()),
        // The frequency which index scheduler executes. 1 day by default.
        indexFrequencyMs: Joi.number().default(moment.duration(1, 'day').asMilliseconds()),
        // The frequency which each repo tries to update. 1 hour by default.
        updateRepoFrequencyMs: Joi.number().default(moment.duration(1, 'hour').asMilliseconds()),
        // The frequency which each repo tries to index. 1 day by default.
        indexRepoFrequencyMs: Joi.number().default(moment.duration(1, 'day').asMilliseconds()),
        // timeout a request over 30s.
        lspRequestTimeoutMs: Joi.number().default(moment.duration(30, 'second').asMilliseconds()),
        repos: Joi.array().default([]),
        maxWorkspace: Joi.number().default(5), // max workspace folder for each language server
        isAdmin: Joi.boolean().default(true), // If we show the admin buttons
        disableScheduler: Joi.boolean().default(true), // Temp option to disable all schedulers.
        enableGlobalReference: Joi.boolean().default(false), // Global reference as optional feature for now
      }).default();
    },

    init(server: Server, options: any) {
      const queueIndex = server.config().get('code.queueIndex');
      const queueTimeout = server.config().get('code.queueTimeout');
      const adminCluster = server.plugins.elasticsearch.getCluster('admin');
      const dataCluster = server.plugins.elasticsearch.getCluster('data');
      const log = new Log(server);
      const serverOptions = new ServerOptions(options, server.config());

      const socketService = new SocketService(log);

      // Initialize search clients
      const repoSearchClient = new RepositorySearchClient(dataCluster.getClient(), log);
      const documentSearchClient = new DocumentSearchClient(dataCluster.getClient(), log);
      const symbolSearchClient = new SymbolSearchClient(dataCluster.getClient(), log);

      // Initialize indexing factories.
      const lspService = new LspService(
        '127.0.0.1',
        serverOptions,
        adminCluster.getClient(),
        new ServerLoggerFactory(server)
      );
      const lspIndexerFactory = new LspIndexerFactory(
        lspService,
        serverOptions,
        adminCluster.getClient(),
        log
      );

      const repoIndexInitializerFactory = new RepositoryIndexInitializerFactory(
        adminCluster.getClient(),
        log
      );

      // Initialize queue worker cancellation service.
      const cancellationService = new CancellationSerivce();

      // Initialize queue.
      const queue = new Esqueue(queueIndex, {
        client: adminCluster.getClient(),
        timeout: queueTimeout,
        doctype: 'esqueue',
      });
      const indexWorker = new IndexWorker(
        queue,
        log,
        adminCluster.getClient(),
        [lspIndexerFactory],
        cancellationService,
        socketService
      ).bind();
      const cloneWorker = new CloneWorker(
        queue,
        log,
        adminCluster.getClient(),
        indexWorker,
        socketService
      ).bind();
      const deleteWorker = new DeleteWorker(
        queue,
        log,
        adminCluster.getClient(),
        cancellationService,
        lspService,
        socketService
      ).bind();
      const updateWorker = new UpdateWorker(queue, log, adminCluster.getClient()).bind();

      // Initialize schedulers.
      const updateScheduler = new UpdateScheduler(
        updateWorker,
        serverOptions,
        adminCluster.getClient(),
        log
      );
      const indexScheduler = new IndexScheduler(
        indexWorker,
        serverOptions,
        adminCluster.getClient(),
        log
      );
      if (!serverOptions.disableScheduler) {
        updateScheduler.start();
        indexScheduler.start();
      }

      // Add server routes and initialize the plugin here
      repositoryRoute(
        server,
        serverOptions,
        cloneWorker,
        deleteWorker,
        indexWorker,
        repoIndexInitializerFactory
      );
      repositorySearchRoute(server, repoSearchClient);
      documentSearchRoute(server, documentSearchClient);
      symbolSearchRoute(server, symbolSearchClient);
      fileRoute(server, serverOptions);
      workspaceRoute(server, serverOptions, adminCluster.getClient());
      monacoRoute(server);
      symbolByQnameRoute(server, symbolSearchClient);
      socketRoute(server, socketService, log);
      userRoute(server, serverOptions);

      lspService.launchServers().then(() => {
        // register lsp route after language server launched
        lspRoute(server, lspService, serverOptions);
      });
    },
  });
