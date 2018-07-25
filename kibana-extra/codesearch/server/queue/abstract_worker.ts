/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { Esqueue, events as esqueueEvents } from '@codesearch/esqueue';
import { Job as JobInternal } from '@codesearch/esqueue/job';
import { Worker as WorkerInternal } from '@codesearch/esqueue/worker';

import { WorkerResult } from '../../model/repository';
import { Log } from '../log';
import { Job } from './job';
import { Worker } from './worker';

export abstract class AbstractWorker implements Worker {
  // The id of the worker. Also serves as the id of the job this worker consumes.
  protected id = '';

  constructor(protected readonly queue: Esqueue, protected readonly log: Log) {}

  // Assemble jobs, for now most of the job object construction should be the same.
  public createJob(payload: any, options: any): Job {
    return {
      payload,
      options,
      cancellationToken: '',
    };
  }

  public async executeJob(job: Job): Promise<WorkerResult> {
    // This is an abstract class. Do nothing here. You should override this.
    return new Promise<WorkerResult>((resolve, _) => {
      resolve();
    });
  }

  // Enqueue the job.
  public async enqueueJob(payload: any, options: any) {
    const job: Job = this.createJob(payload, options);
    return new Promise((resolve, reject) => {
      const jobInternal: JobInternal = this.queue.addJob(this.id, job, {});
      jobInternal.on(esqueueEvents.EVENT_JOB_CREATED, async (createdJob: JobInternal) => {
        if (createdJob.id === jobInternal.id) {
          await this.onJobEnqueued(job);
          resolve(jobInternal);
        }
      });
      jobInternal.on(esqueueEvents.EVENT_JOB_CREATE_ERROR, reject);
    });
  }

  public bind() {
    const workerFn = (payload: any, cancellationToken: string) => {
      const job: Job = {
        ...payload,
        cancellationToken,
      };
      return this.executeJob(job);
    };

    const workerOptions = {
      interval: 3000,
      intervalErrorMultiplier: 1,
    };

    const queueWorker: WorkerInternal = this.queue.registerWorker(this.id, workerFn, workerOptions);

    queueWorker.on(esqueueEvents.EVENT_WORKER_COMPLETE, async (res: any) => {
      const result = res.output.content;
      await this.onJobCompleted(result);
    });
    queueWorker.on(esqueueEvents.EVENT_WORKER_JOB_EXECUTION_ERROR, async (res: any) => {
      await this.onJobExecutionError(res);
    });
    queueWorker.on(esqueueEvents.EVENT_WORKER_JOB_TIMEOUT, async (res: any) => {
      await this.onJobTimeOut(res);
    });

    return this;
  }

  public async onJobEnqueued(job: Job) {
    this.log.info(`${this.id} job enqueued with result ${JSON.stringify(job)}`);
    return await this.updateProgress(job.payload.uri, 0);
  }

  public async onJobCompleted(res: WorkerResult) {
    this.log.info(`${this.id} job completed with result ${JSON.stringify(res)}`);
    return await this.updateProgress(res.uri, 100);
  }

  public async onJobExecutionError(res: any) {
    this.log.info(`${this.id} job execution error ${JSON.stringify(res)}.`);
    return await this.updateProgress(res.job.payload.uri, -100);
  }

  public async onJobTimeOut(res: any) {
    this.log.info(`${this.id} job timed out ${JSON.stringify(res)}`);
    return await this.updateProgress(res.job.payload.uri, -200);
  }

  public async updateProgress(uri: string, progress: number) {
    // This is an abstract class. Do nothing here. You should override this.
    return new Promise<WorkerResult>((resolve, _) => {
      resolve();
    });
  }
}
