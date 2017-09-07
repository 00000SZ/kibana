import { debounce } from 'lodash';
import header from './header.png';
import { Element } from '../element';
import '../../lib/flot';

export default new Element('pie', {
  displayName: 'Pie chart',
  description: 'An customizable element for making pie charts from your data',
  image: header,
  expression: 'filters | demodata | pointseries x="time" y="sum(price)" color="state" | pie | render',
  render(domNode, config, handlers) {
    config.options.legend.labelBoxBorderColor = 'transparent';

    let plot;
    function draw() {
      if (domNode.clientHeight < 1 || domNode.clientWidth < 1) return;

      try {
        if (!plot) {
          plot = $.plot($(domNode), config.data, config.options);
        } else {
          plot.resize();
          plot.draw();
        }
      } catch (e) {
        // Nope
      }

    }

    function destroy() {
      if (plot) plot.shutdown();
    }

    handlers.onDestroy(destroy);
    handlers.onResize(debounce(draw, 40, { maxWait: 40 })); // 1000 / 40 = 25fps

    draw();

    return handlers.done(plot);
  },
});
