/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import fs from 'fs';
import Git from 'nodegit';
import rimraf from 'rimraf';

import { RepositoryUtils } from '../common/repository_utils';
import { CloneWorkerResult, DeleteWorkerResult, Repository, UpdateWorkerResult } from '../model';
import { Log } from './log';

// This is the service for any kind of repository handling, e.g. clone, update, delete, etc.
export class RepositoryService {
  constructor(private readonly repoVolPath: string, private log: Log) {}

  public async clone(repo: Repository): Promise<CloneWorkerResult> {
    if (!repo) {
      throw new Error(`Invalid repository.`);
    } else {
      const localPath = RepositoryUtils.repositoryLocalPath(this.repoVolPath, repo.uri);
      if (fs.existsSync(localPath)) {
        this.log.info(`Repository exist in local path: ${localPath}. Do update instead of clone.`);
        // Do update instead of clone if the local repo exists.
        await this.update(repo.uri);
        return {
          uri: repo.uri,
          repo,
        };
      } else {
        try {
          const gitRepo = await Git.Clone.clone(
            repo.url,
            localPath
            // {
            //   fetchOpts: {
            //     callbacks: {
            //       transferProgress: (stats) => {
            //         const progress = (100 * (stats.receivedObjects() + stats.indexedObjects())) / (stats.totalObjects() * 2);
            //         return progress;
            //       }
            //     }
            //   }
            // }
          );
          const headCommit = await gitRepo.getHeadCommit();
          const headRevision = headCommit.sha();
          this.log.info(
            `Clone repository from ${
              repo.url
            } to ${localPath} done with head revision ${headRevision}`
          );
          return {
            uri: repo.uri,
            repo,
          };
        } catch (error) {
          const msg = `Clone repository from ${repo.url} to ${localPath} error: ${error}`;
          this.log.error(msg);
          throw new Error(msg);
        }
      }
    }
  }

  public async remove(uri: string): Promise<DeleteWorkerResult> {
    const localPath = RepositoryUtils.repositoryLocalPath(this.repoVolPath, uri);
    // For now, just `rm -rf`
    rimraf(localPath, (error: Error) => {
      if (error) {
        this.log.error(`Remove ${localPath} error: ${error}.`);
        throw error;
      }
      this.log.info(`Remove ${localPath} done.`);
    });
    return {
      uri,
      res: true,
    };
  }

  public async update(uri: string): Promise<UpdateWorkerResult> {
    const localPath = RepositoryUtils.repositoryLocalPath(this.repoVolPath, uri);
    try {
      const repo = await Git.Repository.open(localPath);
      await repo.fetchAll();
      // TODO(mengwei): deal with the case when the default branch has changed.
      const currentBranch = await repo.getCurrentBranch();
      const currentBranchName = currentBranch.shorthand();
      await repo.mergeBranches(
        currentBranchName,
        `origin/${currentBranchName}`,
        Git.Signature.default(repo),
        Git.Merge.PREFERENCE.FASTFORWARD_ONLY
      );
      const headCommit = await repo.getHeadCommit();
      this.log.debug(`Update repository to revision ${headCommit.sha()}`);
      return {
        uri,
        branch: currentBranchName,
        revision: headCommit.sha(),
      };
    } catch (error) {
      const msg = `update repository ${uri} error: ${error}`;
      this.log.info(msg);
      throw new Error(msg);
    }
  }
}
