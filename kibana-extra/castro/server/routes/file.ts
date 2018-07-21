/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import Boom from 'boom';
import fileType from 'file-type';
import * as Hapi from 'hapi';
import { GitOperations } from '../git_operations';
import { ServerOptions } from '../server_options';

export function fileRoute(server: Hapi.Server, options: ServerOptions) {
  server.route({
    path: '/api/castro/repo/{site}/{org}/{repo}/tree/{rev}/{path*}',
    method: 'GET',
    async handler(req: Hapi.Request, reply: any) {
      const fileResolver = new GitOperations(options.repoPath);
      const { site, org, repo, path, rev } = req.params;
      const uri = `${site}/${org}/${repo}`;
      const depth = req.query.depth || Number.MAX_SAFE_INTEGER;
      try {
        reply(await fileResolver.fileTree(uri, path, rev, depth));
      } catch (e) {
        if (e.isBoom) {
          reply(e);
        } else {
          reply(Boom.internal(e.message || e.name));
        }
      }
    },
  });

  server.route({
    path: '/api/castro/repo/{site}/{org}/{repo}/blob/{rev}/{path*}',
    method: 'GET',
    async handler(req: Hapi.Request, reply: Hapi.IReply) {
      const fileResolver = new GitOperations(options.repoPath);
      const { site, org, repo, path, rev } = req.params;
      const uri = `${site}/${org}/${repo}`;
      try {
        const blob = await fileResolver.fileContent(uri, path, rev);
        if (blob.isBinary()) {
          const type = fileType(blob.content());
          if (type && type.mime && type.mime.startsWith('image/')) {
            reply(blob.content()).type(type.mime);
          } else {
            // this api will return a empty response with http code 204
            reply('')
              .type('application/octet-stream')
              .code(204);
          }
        } else {
          reply(blob.content()).type('text/plain');
        }
      } catch (e) {
        if (e.isBoom) {
          reply(e);
        } else {
          reply(Boom.internal(e.message || e.name));
        }
      }
    },
  });

  server.route({
    path: '/api/castro/repo/{site}/{org}/{repo}/raw/{rev}/{path*}',
    method: 'GET',
    async handler(req: Hapi.Request, reply: Hapi.IReply) {
      const fileResolver = new GitOperations(options.repoPath);
      const { site, org, repo, path, rev } = req.params;
      const uri = `${site}/${org}/${repo}`;
      try {
        const blob = await fileResolver.fileContent(uri, path, rev);
        if (blob.isBinary()) {
          reply(blob.content()).type('application/octet-stream');
        } else {
          reply(blob.content()).type('text/plain');
        }
      } catch (e) {
        if (e.isBoom) {
          reply(e);
        } else {
          reply(Boom.internal(e.message || e.name));
        }
      }
    },
  });
}
