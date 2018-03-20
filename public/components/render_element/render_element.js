import React from 'react';
import PropTypes from 'prop-types';
import { isEqual, cloneDeep } from 'lodash';
import './render_element.less';
import { RenderToDom } from '../render_to_dom';

export class RenderElement extends React.Component {
  static propTypes = {
    name: PropTypes.string,
    renderFn: PropTypes.func.isRequired,
    reuseNode: PropTypes.bool,
    handlers: PropTypes.object,
    destroyFn: PropTypes.func,
    config: PropTypes.object,
    size: PropTypes.object,
    css: PropTypes.string,
    onError: PropTypes.func.isRequired,
  };

  static domNode = null;

  componentDidMount() {
    this.firstRender = true;
    this.renderTarget = null;
  }

  componentWillReceiveProps({ renderFn }) {
    const newRenderFunction = renderFn !== this.props.renderFn;

    if (newRenderFunction) this.resetRenderTarget(this.domNode);
  }

  shouldComponentUpdate(prevProps) {
    return !isEqual(this.props.size, prevProps.size) || this.shouldFullRerender(prevProps);
  }

  componentDidUpdate(prevProps) {
    const { handlers, size } = this.props;
    // Config changes
    if (this.shouldFullRerender(prevProps)) {
      // This should be the only place you call renderFn besides the first time
      this.callRenderFn();
    }

    // Size changes
    if (!isEqual(size, prevProps.size)) return handlers.resize(size);
  }

  componentWillUnmount() {
    this.props.handlers.destroy();
  }

  callRenderFn = () => {
    const { handlers, config, renderFn, reuseNode, name: functionName } = this.props;
    // TODO: We should wait until handlers.done() is called before replacing the element content?
    if (!reuseNode || !this.renderTarget) this.resetRenderTarget(this.domNode);
    // else if (!firstRender) handlers.destroy();

    const renderConfig = cloneDeep(config);

    // TODO: this is hacky, but it works. it stops Kibana from blowing up when a render throws
    try {
      renderFn(this.renderTarget, renderConfig, handlers);
      this.firstRender = false;
    } catch (err) {
      console.error('renderFn threw', err);
      this.props.onError(`Rendering ${functionName || 'function'} failed: ${err}`);
    }
  };

  resetRenderTarget = domNode => {
    const { handlers } = this.props;

    if (!domNode) throw new Error('RenderElement can not reset undefined target node');

    // call destroy on existing element
    if (!this.firstRender) handlers.destroy();

    while (domNode.firstChild) {
      domNode.removeChild(domNode.firstChild);
    }

    this.firstRender = true;
    this.renderTarget = this.createRenderTarget();
    domNode.appendChild(this.renderTarget);
  };

  createRenderTarget = () => {
    const div = document.createElement('div');
    div.style.width = '100%';
    div.style.height = '100%';
    return div;
  };

  shouldFullRerender = prevProps => {
    // TODO: What a shitty hack. None of these props should update when you move the element.
    // This should be fixed at a higher level.
    return (
      !isEqual(this.props.config, prevProps.config) ||
      !isEqual(this.props.renderFn.toString(), prevProps.renderFn.toString())
    );
  };

  destroy = () => {
    this.props.handlers.destroy();
  };

  render() {
    return (
      <div
        className="canvas__workpad--element_render canvas__element"
        style={{ height: '100%', width: '100%' }}
      >
        <RenderToDom
          style={{ height: '100%', width: '100%' }}
          render={domNode => {
            this.domNode = domNode;
            this.callRenderFn();
          }}
        />
      </div>
    );
  }
}
