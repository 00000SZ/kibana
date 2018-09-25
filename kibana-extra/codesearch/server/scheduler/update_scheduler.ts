/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { EsClient } from '@codesearch/esqueue';

import { REPOSITORY_GIT_STATUS_INDEX_TYPE } from '../../mappings';
import { CloneWorkerProgress, Repository } from '../../model';
import { Log } from '../log';
import { UpdateWorker } from '../queue';
import { ServerOptions } from '../server_options';
import { AbstractScheduler } from './abstract_scheduler';

export class UpdateScheduler extends AbstractScheduler {
  constructor(
    private readonly updateWorker: UpdateWorker,
    private readonly serverOptions: ServerOptions,
    private readonly objectsClient: any,
    client: EsClient,
    protected readonly log: Log
  ) {
    super(client, serverOptions.updateFrequencyMs);
  }

  // TODO: Currently the schduling algorithm the most naive one, which go through
  // all repositories and execute update. Later we can repeat the one we used
  // before for task throttling.
  protected async executeSchedulingJob(repo: Repository) {
    this.log.info(`Schedule update repo request for ${repo.uri}`);
    try {
      const res = await this.objectsClient.get(REPOSITORY_GIT_STATUS_INDEX_TYPE, repo.uri);
      const cloneStatus: CloneWorkerProgress = res.attributes;
      // Schedule update job only when the repo has been fully cloned already
      if (
        cloneStatus.cloneProgress &&
        cloneStatus.cloneProgress.isCloned &&
        cloneStatus.progress === 100
      ) {
        const payload = {
          uri: repo.uri,
          dataPath: this.serverOptions.repoPath,
        };
        await this.updateWorker.enqueueJob(payload, {});
      } else {
        this.log.info(`Repo ${repo.uri} has not been fully cloned yet or in update. Skip update.`);
      }
    } catch (error) {
      this.log.info(`Schedule update for ${repo.uri} error. ${error}`);
    }
  }
}
