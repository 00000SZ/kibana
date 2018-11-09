/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { EsClient } from '@code/esqueue';
import fs from 'fs';
import util from 'util';

import { ProgressReporter } from '.';
import { RepositoryUtils } from '../../common/repository_utils';
import { toCanonicalUrl } from '../../common/uri_util';
import { Document, IndexStats, IndexStatsKey, LspIndexRequest, RepositoryUri } from '../../model';
import { GitOperations } from '../git_operations';
import { Log } from '../log';
import { LspService } from '../lsp/lsp_service';
import { ServerOptions } from '../server_options';
import { detectLanguage, detectLanguageByFilename } from '../utils/detect_language';
import { AbstractIndexer } from './abstract_indexer';
import { BatchIndexHelper } from './batch_index_helper';
import { IndexCreationRequest } from './index_creation_request';
import {
  DocumentAnalysisSettings,
  DocumentIndexName,
  DocumentSchema,
  DocumentTypeName,
  ReferenceIndexName,
  ReferenceSchema,
  ReferenceTypeName,
  RepositoryReservedField,
  SymbolAnalysisSettings,
  SymbolIndexName,
  SymbolSchema,
  SymbolTypeName,
} from './schema';

export class LspIndexer extends AbstractIndexer {
  protected type: string = 'lsp';
  // Currently without the multi revision support, we use this placeholder revision string
  // to construct any ES document id.
  private PLACEHOLDER_REVISION: string = 'head';
  private batchIndexHelper: BatchIndexHelper;

  constructor(
    protected readonly repoUri: RepositoryUri,
    protected readonly revision: string,
    protected readonly lspService: LspService,
    protected readonly options: ServerOptions,
    protected readonly client: EsClient,
    protected readonly log: Log
  ) {
    super(repoUri, revision, client, log);

    this.batchIndexHelper = new BatchIndexHelper(client, log);
  }

  public async start(progressReporter?: ProgressReporter) {
    const res = await super.start(progressReporter);
    // Flush all the index request still in the cache for bulk index.
    this.batchIndexHelper.flush();
    return res;
  }

  protected async prepareIndexCreationRequests() {
    const contentIndexCreationReq: IndexCreationRequest = {
      index: DocumentIndexName(this.repoUri),
      type: DocumentTypeName,
      settings: {
        ...DocumentAnalysisSettings,
        number_of_shards: 1,
        auto_expand_replicas: '0-1',
      },
      schema: DocumentSchema,
    };
    const symbolIndexCreationReq: IndexCreationRequest = {
      index: SymbolIndexName(this.repoUri),
      type: SymbolTypeName,
      settings: {
        ...SymbolAnalysisSettings,
        number_of_shards: 1,
        auto_expand_replicas: '0-1',
      },
      schema: SymbolSchema,
    };
    const referenceIndexCreationReq: IndexCreationRequest = {
      index: ReferenceIndexName(this.repoUri),
      type: ReferenceTypeName,
      settings: {
        number_of_shards: 1,
        auto_expand_replicas: '0-1',
      },
      schema: ReferenceSchema,
    };
    return [contentIndexCreationReq, symbolIndexCreationReq, referenceIndexCreationReq];
  }

  protected async prepareRequests() {
    try {
      const {
        workspaceRepo,
        workspaceRevision,
      } = await this.lspService.workspaceHandler.openWorkspace(this.repoUri, 'head');
      const workspaceDir = workspaceRepo.workdir();
      const gitOperator = new GitOperations(this.options.repoPath);
      const fileTree = await gitOperator.fileTree(
        this.repoUri,
        '',
        'HEAD',
        0,
        Number.MAX_SAFE_INTEGER,
        false,
        Number.MAX_SAFE_INTEGER
      );
      return RepositoryUtils.getAllFiles(fileTree)
        .filter((filePath: string) => {
          const lang = detectLanguageByFilename(filePath);
          return lang && this.lspService.supportLanguage(lang);
        })
        .map((filePath: string) => {
          const req: LspIndexRequest = {
            repoUri: this.repoUri,
            localRepoPath: workspaceDir,
            filePath,
            revision: workspaceRevision,
          };
          return req;
        });
    } catch (e) {
      this.log.error(`Prepare lsp indexing requests error: ${e}`);
      throw e;
    }
  }

  protected async cleanIndex(repoUri: RepositoryUri) {
    // Clean up all the symbol documents in the symbol index
    try {
      await this.client.deleteByQuery({
        index: SymbolIndexName(repoUri),
        body: {
          query: {
            match_all: {},
          },
        },
      });
      this.log.info(`Clean up symbols for ${repoUri} done.`);
    } catch (error) {
      this.log.error(`Clean up symbols for ${repoUri} error: ${error}`);
    }

    // Clean up all the reference documents in the reference index
    try {
      await this.client.deleteByQuery({
        index: ReferenceIndexName(repoUri),
        body: {
          query: {
            match_all: {},
          },
        },
      });
      this.log.info(`Clean up references for ${repoUri} done.`);
    } catch (error) {
      this.log.error(`Clean up references for ${repoUri} error: ${error}`);
    }

    // Clean up all the document documents in the document index but keep the repository document.
    try {
      await this.client.deleteByQuery({
        index: DocumentIndexName(repoUri),
        body: {
          query: {
            bool: {
              must_not: [
                {
                  exists: {
                    field: RepositoryReservedField,
                  },
                },
              ],
            },
          },
        },
      });
      this.log.info(`Clean up documents for ${repoUri} done.`);
    } catch (error) {
      this.log.error(`Clean up documents for ${repoUri} error: ${error}`);
    }
  }

  protected async processRequest(request: LspIndexRequest): Promise<IndexStats> {
    const stats: IndexStats = new Map<IndexStatsKey, number>()
      .set(IndexStatsKey.Symbol, 0)
      .set(IndexStatsKey.Reference, 0)
      .set(IndexStatsKey.File, 0);
    const { repoUri, revision, filePath, localRepoPath } = request;
    const lspDocUri = toCanonicalUrl({ repoUri, revision, file: filePath, schema: 'git:' });
    const symbolNames = new Set<string>();

    try {
      const response = await this.lspService.sendRequest('textDocument/full', {
        textDocument: {
          uri: lspDocUri,
        },
        reference: this.options.enableGlobalReference,
      });

      if (response && response.result.length > 0) {
        const { symbols, references } = response.result[0];
        for (const symbol of symbols) {
          await this.batchIndexHelper.index(
            SymbolIndexName(repoUri),
            SymbolTypeName,
            `${repoUri}:${this.PLACEHOLDER_REVISION}:${filePath}:${symbol.symbolInformation.name}`,
            symbol
          );
          symbolNames.add(symbol.symbolInformation.name);
        }
        stats.set(IndexStatsKey.Symbol, symbols.length);

        for (const ref of references) {
          await this.batchIndexHelper.index(
            ReferenceIndexName(repoUri),
            ReferenceTypeName,
            `${repoUri}:${this.PLACEHOLDER_REVISION}:${filePath}:${ref.location.uri}:${
              ref.location.range.start.line
            }:${ref.location.range.start.character}`,
            ref
          );
        }
        stats.set(IndexStatsKey.Reference, references.length);
      } else {
        this.log.debug(`Empty response from lsp server. Skip symbols and references indexing.`);
      }
    } catch (error) {
      this.log.info(`Index symbols or references error: ${error}. Skip to file indexing.`);
    }

    const localFilePath = `${localRepoPath}${filePath}`;
    const readFile = util.promisify(fs.readFile);
    const content = await readFile(localFilePath, 'utf8');
    const language = await detectLanguage(filePath, Buffer.from(content));
    const body: Document = {
      repoUri,
      path: filePath,
      content,
      language,
      qnames: Array.from(symbolNames),
    };
    await this.client.index({
      index: DocumentIndexName(repoUri),
      type: DocumentTypeName,
      id: `${repoUri}:${this.PLACEHOLDER_REVISION}:${filePath}`,
      body,
    });
    stats.set(IndexStatsKey.File, 1);
    return stats;
  }
}
