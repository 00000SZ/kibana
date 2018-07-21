/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { Job } from './job';

export interface Worker {
  createJob(payload: any, options: any): Job;
  executeJob(job: Job): void;
  enqueueJob(payload: any, options: any): void;
}
