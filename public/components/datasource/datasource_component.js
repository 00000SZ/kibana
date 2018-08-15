import React, { Fragment, PureComponent } from 'react';
import PropTypes from 'prop-types';
import {
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiButton,
  EuiButtonEmpty,
  EuiSpacer,
} from '@elastic/eui';
import { isEqual } from 'lodash';
import { DatasourceSelector } from './datasource_selector';
import { DatasourcePreview } from './datasource_preview';

export class DatasourceComponent extends PureComponent {
  static propTypes = {
    args: PropTypes.object.isRequired,
    datasources: PropTypes.array.isRequired,
    datasource: PropTypes.object.isRequired,
    datasourceDef: PropTypes.object.isRequired,
    stateDatasource: PropTypes.shape({
      name: PropTypes.string.isRequired,
      render: PropTypes.func.isRequired,
    }).isRequired,
    selectDatasource: PropTypes.func,
    setDatasourceAst: PropTypes.func,
    stateArgs: PropTypes.object.isRequired,
    updateArgs: PropTypes.func,
    resetArgs: PropTypes.func.isRequired,
    selecting: PropTypes.bool,
    setSelecting: PropTypes.func,
    previewing: PropTypes.bool,
    setPreviewing: PropTypes.func,
  };

  componentDidUpdate(prevProps) {
    if (!isEqual(prevProps.args, this.props.args)) {
      this.props.resetArgs();
    }
  }

  getDatasourceFunctionNode = (name, args) => ({
    arguments: args,
    function: name,
    type: 'function',
  });

  setSelectedDatasource = value => {
    const {
      datasource,
      resetArgs,
      updateArgs,
      selectDatasource,
      datasources,
      setSelecting,
    } = this.props;

    if (datasource.name === value) {
      // if selecting the current datasource, reset the arguments
      resetArgs && resetArgs();
    } else {
      // otherwise, clear the arguments, the form will update them
      updateArgs && updateArgs({});
    }
    selectDatasource && selectDatasource(datasources.find(d => d.name === value));
    setSelecting(false);
  };

  save = () => {
    const { stateDatasource, stateArgs, setDatasourceAst } = this.props;
    const datasourceAst = this.getDatasourceFunctionNode(stateDatasource.name, stateArgs);
    setDatasourceAst && setDatasourceAst(datasourceAst);
  };

  render() {
    const {
      datasources,
      datasourceDef,
      stateDatasource,
      stateArgs,
      updateArgs,
      selecting,
      setSelecting,
      previewing,
      setPreviewing,
    } = this.props;

    if (selecting) {
      return <DatasourceSelector datasources={datasources} onSelect={this.setSelectedDatasource} />;
    }

    return (
      <Fragment>
        <EuiPanel>
          <EuiButtonEmpty
            iconSide="right"
            flush="left"
            iconType="sortRight"
            onClick={() => setSelecting(!selecting)}
          >
            Change your data source
          </EuiButtonEmpty>
          <EuiSpacer size="s" />
          {stateDatasource.render({ args: stateArgs, updateArgs, datasourceDef })}
          <EuiSpacer size="m" />
          <EuiFlexGroup justifyContent="flexEnd" gutterSize="s">
            <EuiFlexItem grow={false}>
              <EuiButton size="s" onClick={() => setPreviewing(true)} icon="check">
                Preview
              </EuiButton>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButton size="s" color="secondary" fill onClick={this.save} icon="check">
                Save
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPanel>

        <DatasourcePreview
          show={previewing}
          done={() => setPreviewing(false)}
          function={this.getDatasourceFunctionNode(stateDatasource.name, stateArgs)}
        />
      </Fragment>
    );
  }
}
