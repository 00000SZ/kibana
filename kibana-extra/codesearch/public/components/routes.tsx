/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */
import pathToRegexp from 'path-to-regexp';

export enum PathTypes {
  blob = 'blob',
  tree = 'tree',
}

export const ROOT = '/';
export const MAIN = `/:resource/:org/:repo/:pathType(${PathTypes.blob}|${
  PathTypes.blob
})/:revision/:path*:goto(!.*)?`;
export const ADMIN = '/admin';

export const adminRegex = pathToRegexp(ADMIN);
export const mainRegex = pathToRegexp(MAIN);
