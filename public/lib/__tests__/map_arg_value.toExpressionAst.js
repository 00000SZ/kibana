import expect from 'expect.js';
import { toExpressionAst } from '../map_arg_value';

describe('mapArgValue.toExpressionAst', () => {
  describe('expressions and partials', () => {
    it('returns the "expression" value as the ast', () => {
      const argValue = {
        type: 'expression',
        value: 'csv "stuff\nthings"',
        function: null,
      };

      expect(toExpressionAst(argValue)).to.eql({
        type: 'expression',
        chain: [{
          type: 'function',
          function: 'csv',
          arguments: {
            _: [{
              type: 'string',
              value: 'stuff\nthings',
            }],
          },
        }],
      });
    });

    it('returns the "partial" value as the ast', () => {
      const argValue = {
        type: 'expression',
        value: '.{partial "i am a partial"}',
        function: null,
      };

      expect(toExpressionAst(argValue)).to.eql({
        type: 'partial',
        chain: [{
          type: 'function',
          function: 'partial',
          arguments: {
            _: [{
              type: 'string',
              value: 'i am a partial',
            }],
          },
        }],
      });
    });

    it('returns array of values with asts', () => {
      const argValue = [{
        type: 'expression',
        value: 'csv "stuff\nthings"',
        function: null,
      }, {
        type: 'expression',
        value: '.{partial "i am a partial"}',
        function: null,
      }];

      expect(toExpressionAst(argValue)).to.eql([{
        type: 'expression',
        chain: [{
          type: 'function',
          function: 'csv',
          arguments: {
            _: [{
              type: 'string',
              value: 'stuff\nthings',
            }],
          },
        }],
      }, {
        type: 'partial',
        chain: [{
          type: 'function',
          function: 'partial',
          arguments: {
            _: [{
              type: 'string',
              value: 'i am a partial',
            }],
          },
        }],
      }]);
    });
  });

  describe('math expressions', () => {
    it('turns simple math into a string', () => {
      const argValue = {
        type: 'math',
        value: 'cost',
        function: 'median',
      };

      expect(toExpressionAst(argValue)).to.eql({
        type: 'string',
        value: 'median(cost)',
        function: null,
      });
    });

    it('turns complex math into a string', () => {
      const argValue = {
        type: 'math',
        value: 'sum(cost + 100)',
        function: null,
      };

      expect(toExpressionAst(argValue)).to.eql({
        type: 'string',
        value: 'sum(cost + 100)',
        function: null,
      });
    });

    it('treats empty function string as no function', () => {
      const argValue = {
        type: 'math',
        value: 'sum(cost + 100)',
        function: '',
      };

      expect(toExpressionAst(argValue)).to.eql({
        type: 'string',
        value: 'sum(cost + 100)',
        function: null,
      });
    });

    it('turns simple and complex math strings from array', () => {
      const argValue = [{
        type: 'math',
        value: 'cost',
        function: 'median',
      }, {
        type: 'math',
        value: 'percent(cost) * 100',
        function: null,
      }, {
        type: 'math',
        value: 'cost',
        function: '',
      }];

      expect(toExpressionAst(argValue)).to.eql([{
        type: 'string',
        value: 'median(cost)',
        function: null,
      }, {
        type: 'string',
        value: 'percent(cost) * 100',
        function: null,
      }, {
        type: 'string',
        value: 'cost',
        function: null,
      }]);
    });
  });
});
