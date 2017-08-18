import { clone, each, keys, last, map, mapValues, values, zipObject, omitBy } from 'lodash';
import { castProvider } from './cast';
import { getType } from '../types/get_type';

export function interpretProvider(config) {
  const cast = castProvider(config.types);
  const functions = config.functions;
  const onFunctionNotFound = config.onFunctionNotFound;

  return interpret;

  function interpret(node, context = null) {
    switch (getType(node)) {
      case 'partial':
        return (partialContext) => invokeChain(node.chain, partialContext);
      case 'expression':
        return invokeChain(node.chain, context);
      case 'function':
        return node;
      case 'string':
      case 'number':
      case 'null':
      case 'boolean':
        return Promise.resolve(node.value);
      default:
        throw new Error(`Unknown AST object: ${JSON.stringify(node)}`);
    }
  }

  function invokeChain(chainArr, context) {
    if (!chainArr.length) return Promise.resolve(context);

    const chain = clone(chainArr);
    const link = chain.shift(); // Every thing in the chain will always be a function right?
    const name = link.function;
    const args = link.arguments;

    const fnDef = functions[name];
    if (!fnDef) {
      chain.unshift(link);
      return onFunctionNotFound({ type: 'expression', chain: chain }, context);
    }

    // TODO: handle errors here
    return resolveArgs(name, context, args) // Resolve arguments before passing to function
    .then((resolvedArgs) => {
      return invokeFunction(name, context, resolvedArgs) // Then invoke function with resolved arguments
      .then(newContext => invokeChain(chain, newContext)) // Continue re-invoking chain until its empty
      .catch(e => {
        console.log('common/interpret: Function rejected');
        throw e;
      });
    })
    .catch(e => {
      console.log('common/interpret: Args rejected', e);
      throw e;
    });
  }

  function invokeFunction(name, context, args) {
    // Check function input.
    const fnDef = functions[name];
    const acceptableContext =  cast(context, fnDef.context.types);

    return fnDef.fn(acceptableContext, args).then(output => {
      // Validate that the function returned the type it said it would.
      // This isn't really required, but it keeps function developers honest.
      const returnType = getType(output);
      const expectedType = fnDef.type;
      if (expectedType && returnType !== expectedType) {
        throw new Error(`Function ${name} should return '${expectedType}', actually returned '${returnType}'`);
      }

      return output;
    });
  }

  // Processes the multi-valued AST argument values into arguments that can be passed to the function
  function resolveArgs(fnName, context, astArgs) {
    const fnDef = functions[fnName];
    const argDefs = fnDef.args;

    // Break this into keys and values, then recombine later.
    const argNames = keys(astArgs).map(argName => {
      if (!argDefs[argName]) throw new Error(`Unknown argument '${argName}' passed to function ${fnDef.name}()`);
      return argDefs[argName].name;
    });
    const multiValuedArgs = values(astArgs);


    // Create an array of promises, each representing 1 argument name
    const argListPromises = map(multiValuedArgs, multiValueArg => {
      // Also an array of promises. Since each argument in the AST is multivalued each
      // argument value is an array. We use Promise.all to turn the values into a single promise.

      // Note that we're resolving the argument values before even looking up their definition
      return Promise.all(map(multiValueArg, argValue => interpret(argValue, context)));
    });


    return Promise.all(argListPromises)
    .then(resolvedArgs => zipObject(argNames, resolvedArgs)) // Recombine the keys
    .then(resolvedArgs => {
      // Fill in defaults
      const args = mapValues(omitBy(argDefs, { isAlias: true }), (argDef, name) => {
        if (typeof resolvedArgs[name] !== 'undefined') return resolvedArgs[name];

        // Still treating everything as multivalued here
        if (typeof argDef.default !== 'undefined') return [argDef.default];
        return [null];
      });

      // Validate and normalize the argument values.
      return mapValues(args, (val, name) => {
        // TODO: Implement a system to allow for undeclared arguments
        const argDef = argDefs[name];
        if (!argDef) throw new Error(`Unknown argument to function: ${fnName}(${name})`);

        // Return an array for multi-valued arguments
        if (argDef.multi) {
          each(val, argValue => cast(argValue, argDef.types));
          return val;
        }

        // Otherwise return the final instance
        const argValue = last(val);
        return cast(argValue, argDef.types);
      });
    });
  }
}
