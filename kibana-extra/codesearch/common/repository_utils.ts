/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import GitUrlParse from 'git-url-parse';
import path from 'path';

import { Repository, RepositoryUri } from '../model';

export class RepositoryUtils {
  // Generate a Repository instance by parsing repository remote url
  // TODO(mengwei): This is a very naive implementation, need improvements.
  public static buildRepository(remoteUrl: string): Repository {
    const repo = GitUrlParse(remoteUrl);
    const uri: RepositoryUri = repo.source + '/' + repo.full_name;
    return {
      uri,
      url: repo.href as string,
      name: repo.name as string,
      org: repo.owner as string,
    };
  }

  // Return the local data path of a given repository.
  public static repositoryLocalPath(repoPath: string, repoUri: RepositoryUri) {
    return path.join(repoPath, repoUri);
  }

  public static normalizeRepoUriToIndexName(repoUri: RepositoryUri) {
    return repoUri
      .split('/')
      .join('-')
      .toLowerCase();
  }
}
