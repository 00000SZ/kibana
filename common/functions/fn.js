import { each, includes } from 'lodash';
import Arg from './arg';

export default function Fn(config) {
  // Required
  this.name = config.name; // Name of function
  this.type = config.type; // Return type of function
  this.aliases = config.aliases || [];

  // Function to run function (context, args)
  this.fn = (...args) => Promise.resolve(config.fn(...args));

  // Optional
  this.help = config.help || ''; // A short help text
  this.args = {};
  each(config.args, (arg, name) => {
    this.args[name] = new Arg(Object.assign({ name: name }, arg));
    each(arg.aliases, alias => {
      this.args[alias] = new Arg(Object.assign({ name: name, isAlias: true }, arg));
    });
  });

  this.context = config.context || {};

  this.accepts = (type) => {
    if (!this.context.types) return true; // If you don't tell us about context, we'll assume you don't care what you get
    return includes(this.context.types, type); // Otherwise, check it
  };
}
