import React, { useRef, useState, useEffect, Fragment } from "react";
// @ts-ignore
import GraphiQL from "@forked/graphiql";
import { Observable, useQuery, makeVar, useReactiveVar, gql, FetchResult } from "@apollo/client";
import type { GraphQLSchema, IntrospectionQuery } from "graphql";
import { getIntrospectionQuery, buildClientSchema } from "graphql/utilities";
import { parse } from "graphql/language/parser";
import { print } from "graphql/language/printer";
import GraphiQLExplorer from "graphiql-explorer";
import { Button } from "@apollo/space-kit/Button";
import { colorTheme } from '../index';
import { ColorTheme } from '../theme';
import { sendGraphiQLRequest, receiveGraphiQLResponses, listenForResponse } from './graphiQLRelay';
import { FullWidthLayout } from '../Layouts/FullWidthLayout';

import "@forked/graphiql-css";

enum FetchPolicy {
  NoCache = 'no-cache',
  CacheOnly = 'cache-only'
}

export const graphiQLQuery = makeVar<string>('');

export const Explorer = ({ navigationProps }) => {
  const graphiQLRef = useRef<GraphiQL>(null);
  const [schema, setSchema] = useState<GraphQLSchema>();
  const [isExplorerOpen, setIsExplorerOpen] = useState<boolean>(false);
  const [queryCache, setQueryCache] = useState<FetchPolicy>(FetchPolicy.NoCache);

  const theme = useReactiveVar(colorTheme);
  const query = useReactiveVar(graphiQLQuery);

  const executeOperation = ({ query, operationName, variables, fetchPolicy = queryCache }) => new Observable<FetchResult>(observer => {
    const payload = JSON.stringify({
      query,
      operationName,
      variables,
      fetchPolicy,
    });

    sendGraphiQLRequest(payload);
    listenForResponse(operationName, payload => {
      observer.next(payload);
      observer.complete();
    });
  });

  // Subscribe to GraphiQL data responses
  // Returns a cleanup method to useEffect
  useEffect(() => receiveGraphiQLResponses());

  useEffect(() => {
    const observer = executeOperation({ 
      query: getIntrospectionQuery(), 
      operationName: 'IntrospectionQuery', 
      variables: null,
      fetchPolicy: FetchPolicy.NoCache, 
    });

    observer.subscribe(response => {
      setSchema(buildClientSchema(response.data as IntrospectionQuery));
    });
  }, []);

  const handleClickPrettifyButton = () => {
    const editor = graphiQLRef.current?.getQueryEditor();
    const currentText = editor.getValue();
    const prettyText = print(parse(currentText));
    editor.setValue(prettyText);
  };

  const handleToggleExplorer = () => setIsExplorerOpen(!isExplorerOpen);

  return (
    <FullWidthLayout navigationProps={navigationProps}>
      <FullWidthLayout.Header>
        <Button
          title="Prettify"
          onClick={handleClickPrettifyButton}
        >
          Prettify
        </Button>
        <Button
          title="Toggle Explorer"
          onClick={handleToggleExplorer}
        >
          Explorer
        </Button>
        <label>
          <input
            type="checkbox"
            name="loadFromCache"
            checked={queryCache === FetchPolicy.CacheOnly}
            onChange={() => setQueryCache(queryCache === FetchPolicy.CacheOnly ? FetchPolicy.NoCache : FetchPolicy.CacheOnly)}
          />
          Load from cache
        </label>
      </FullWidthLayout.Header>
      <FullWidthLayout.Main>
      <GraphiQL
        ref={graphiQLRef}
        fetcher={executeOperation as any}
        schema={schema}
        query={query}
        editorTheme={theme === ColorTheme.Dark ? 'dracula' : 'graphiql'}
        onEditQuery={newQuery => graphiQLQuery(newQuery)}
        render={({ Logo }) => {
          return (
            <Fragment>
              <GraphiQLExplorer
                schema={schema}
                query={query}
                onEdit={newQuery => graphiQLQuery(newQuery)}
                explorerIsOpen={isExplorerOpen}
                onToggleExplorer={handleToggleExplorer}
              />
              <Logo />
            </Fragment>
          );
        }}
      >
        <GraphiQL.Toolbar />
      </GraphiQL>
      </FullWidthLayout.Main>
    </FullWidthLayout>
  );
};
