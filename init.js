import { routes } from './server/routes';
import { functionsRegistry } from './common/lib/functions_registry';
import { typesRegistry } from './common/lib/types_registry';
import { serverFunctions } from './server/functions';
import { commonFunctions } from './common/functions';
import { typeSpecs } from './common/types';

export default function(server /*options*/) {
  server.plugins.canvas = {
    kibanaType: 'canvas_1',
    /*
      For now, portable/common functions must be added to both the client and the server.
      server.plugins.canvas.addFunction(require('./someFunction'))
    */

    addFunction(fnDef) {
      functionsRegistry.register(fnDef);
    },

    addType(typeDef) {
      typesRegistry.register(typeDef);
    },
  };

  // register all of the functions and types using the plugin's methods
  const { addFunction, addType } = server.plugins.canvas;
  serverFunctions.forEach(addFunction);
  commonFunctions.forEach(addFunction);
  typeSpecs.forEach(addType);

  // Load routes here
  routes(server);
}
