/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */
import produce from 'immer';
import { Action, handleActions } from 'redux-actions';

import { Repository } from '../../model';

import {
  deleteRepoSuccess,
  fetchRepos,
  fetchReposFailed,
  fetchReposSuccess,
  importRepo,
  importRepoFailed,
  importRepoSuccess,
} from '../actions';

export interface RepositoryState {
  repositories: Repository[];
  error?: Error;
  loading: boolean;
  importLoading: boolean;
}

const initialState: RepositoryState = {
  repositories: [],
  loading: false,
  importLoading: false,
};

export const repository = handleActions(
  {
    [String(fetchRepos)]: (state: RepositoryState) =>
      produce<RepositoryState>(state, draft => {
        draft.loading = true;
      }),
    [String(fetchReposSuccess)]: (state: RepositoryState, action: Action<Repository[]>) =>
      produce<RepositoryState>(state, draft => {
        draft.loading = false;
        draft.repositories = action.payload || [];
      }),
    [String(fetchReposFailed)]: (state: RepositoryState, action: Action<any>) => {
      if (action.payload) {
        return produce<RepositoryState>(state, draft => {
          draft.error = action.payload;
          draft.loading = false;
        });
      } else {
        return state;
      }
    },
    [String(deleteRepoSuccess)]: (state: RepositoryState, action: Action<any>) =>
      produce<RepositoryState>(state, draft => {
        draft.repositories = state.repositories.filter(repo => repo.uri !== action.payload);
      }),
    [String(importRepo)]: (state: RepositoryState) =>
      produce<RepositoryState>(state, draft => {
        draft.importLoading = true;
      }),
    [String(importRepoSuccess)]: (state: RepositoryState, action: Action<any>) =>
      produce<RepositoryState>(state, draft => {
        draft.importLoading = false;
        draft.repositories = [...state.repositories, action.payload];
      }),
    [String(importRepoFailed)]: (state: RepositoryState) =>
      produce<RepositoryState>(state, draft => {
        draft.importLoading = false;
      }),
  },
  initialState
);
