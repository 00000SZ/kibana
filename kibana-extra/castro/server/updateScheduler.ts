/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { REPOSITORY_INDEX_TYPE } from '../mappings';
import { Poller } from './lib/poller';
import { UpdateWorker } from './server/queue';
import ServerOptions from './ServerOptions';

export interface UpdateSchedulerOptions {
  updateFrequencyMs: string;
  serverOptions: ServerOptions;
}
export default class UpdateScheduler {
  private poller: Poller;

  constructor(
    private readonly updateWorker: UpdateWorker,
    private readonly options: UpdateSchedulerOptions,
    private readonly callCluster: (m: string, params: any) => any
  ) {
    this.poller = new Poller({
      functionToPoll: () => {
        return this.schedule();
      },
      pollFrequencyInMillis: options.updateFrequencyMs,
      trailing: true,
      continuePollingOnError: true,
      pollFrequencyErrorMultiplier: 2,
    });
  }

  public start() {
    this.poller.start();
  }

  public stop() {
    this.poller.stop();
  }

  // TODO: Currently the schduling algorithm the most naive one, which go through
  // all repositories and execute update. Later we can repeat the one we used
  // before for task throttling.
  private schedule() {
    const req = {
      index: '.kibana',
      body: {
        query: {
          match: {
            type: REPOSITORY_INDEX_TYPE,
          },
        },
      },
    };
    return this.callCluster('search', req).then((res: any) => {
      Array.from(res.hits.hits).map((hit: any) => {
        const uri = hit._source[REPOSITORY_INDEX_TYPE].uri;
        const payload = {
          uri,
          dataPath: this.options.serverOptions.repoPath,
        };
        this.updateWorker.enqueueJob(payload, {});
      });
    });
  }
}
