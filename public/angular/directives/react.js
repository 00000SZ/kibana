import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { Provider } from 'react-redux';
import { uiModules } from 'ui/modules';

const app = uiModules.get('apps/canvas');
app.directive('react', (canvasStore) => {
  return {
    restrict: 'E',
    scope: {
      component: '=',
    },
    link: ($scope, $el) => {
      const Component = $scope.component;

      render((
        <Provider store={canvasStore}>
          <Component />
        </Provider>
      ), $el[0]);

      $scope.$on('$destroy', () => {
        unmountComponentAtNode($el[0]);
      });
    },
  };
});
