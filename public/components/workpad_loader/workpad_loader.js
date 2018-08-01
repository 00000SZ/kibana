import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiBasicTable,
  EuiButtonIcon,
  EuiText,
  EuiTitle,
  EuiPagination,
  EuiSpacer,
  EuiButton,
  EuiToolTip,
} from '@elastic/eui';
import { sortByOrder } from 'lodash';
import moment from 'moment';
import { ConfirmModal } from '../confirm_modal';
import { Link } from '../link';
import { Paginate } from '../paginate';
import { WorkpadUpload } from './workpad_upload';
import { WorkpadCreate } from './workpad_create';
import { WorkpadSearch } from './workpad_search';

const formatDate = date => date && moment(date).format('MMM D, YYYY @ h:mma');

export class WorkpadLoader extends React.PureComponent {
  static propTypes = {
    workpadId: PropTypes.string.isRequired,
    createWorkpad: PropTypes.func.isRequired,
    findWorkpads: PropTypes.func.isRequired,
    downloadWorkpad: PropTypes.func.isRequired,
    cloneWorkpad: PropTypes.func.isRequired,
    removeWorkpads: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    workpads: PropTypes.object,
  };

  state = {
    deletingWorkpad: false,
    createPending: false,
    sortField: '@timestamp',
    sortDirection: 'desc',
    selectedWorkpads: [],
    pageSize: 10,
  };

  async componentDidMount() {
    // on component load, kick off the workpad search
    this.props.findWorkpads();
  }

  componentWillReceiveProps(newProps) {
    // the workpadId prop will change when a is created or loaded, close the toolbar when it does
    const { workpadId, onClose } = this.props;
    if (workpadId !== newProps.workpadId) onClose();
  }

  // create new empty workpad
  createWorkpad = () => {
    this.setState({ createPending: true });
    this.props.createWorkpad();
  };

  // create new workpad from uploaded JSON
  uploadWorkpad = workpad => {
    this.setState({ createPending: true });
    this.props.createWorkpad(workpad);
  };

  // clone existing workpad
  cloneWorkpad = workpad => {
    this.setState({ createPending: true });
    this.props.cloneWorkpad(workpad.id);
  };

  // Workpad remove methods
  openRemoveConfirm = () => this.setState({ deletingWorkpad: true });

  closeRemoveConfirm = () => this.setState({ deletingWorkpad: false });

  removeWorkpads = () => {
    this.props.removeWorkpads(this.state.selectedWorkpads.map(({ id }) => id));
    this.setState({ deletingWorkpad: false, selectedWorkpads: [] });
  };

  // downloads selected workpads as JSON files
  downloadWorkpads = () => {
    this.state.selectedWorkpads.forEach(({ id }) => this.props.downloadWorkpad(id));
  };

  onSelectionChange = selectedWorkpads => {
    this.setState({ selectedWorkpads });
  };

  onTableChange = ({ sort = {} }) => {
    const { field: sortField, direction: sortDirection } = sort;
    this.setState({
      sortField,
      sortDirection,
    });
  };

  renderWorkpadTable = ({ rows, pageNumber, totalPages, setPage }) => {
    const { sortField, sortDirection } = this.state;

    const actions = [
      {
        render: workpad => (
          <EuiFlexGroup gutterSize="xs" alignItems="center">
            <EuiFlexItem grow={false}>
              <EuiToolTip content="Download">
                <EuiButtonIcon
                  iconType="sortDown"
                  onClick={() => this.props.downloadWorkpad(workpad.id)}
                  aria-label="Download Workpad"
                />
              </EuiToolTip>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiToolTip content="Clone">
                <EuiButtonIcon
                  iconType="copy"
                  onClick={() => this.cloneWorkpad(workpad)}
                  aria-label="Clone Workpad"
                />
              </EuiToolTip>
            </EuiFlexItem>
          </EuiFlexGroup>
        ),
      },
    ];

    const columns = [
      {
        field: 'name',
        name: 'Workpad Name',
        sortable: true,
        dataType: 'string',
        render: (name, workpad) => {
          const workpadName = workpad.name.length ? workpad.name : <em>{workpad.id}</em>;

          return (
            <Link
              name="loadWorkpad"
              params={{ id: workpad.id }}
              aria-label={`Load workpad ${workpadName}`}
            >
              {workpadName}
            </Link>
          );
        },
      },
      {
        field: '@created',
        name: 'Created',
        sortable: true,
        dataType: 'date',
        width: '20%',
        render: date => formatDate(date),
      },
      {
        field: '@timestamp',
        name: 'Updated',
        sortable: true,
        dataType: 'date',
        width: '20%',
        render: date => formatDate(date),
      },
      { name: '', actions, width: '5%' },
    ];

    const sorting = {
      sort: {
        field: sortField,
        direction: sortDirection,
      },
    };

    const selection = {
      itemId: 'id',
      onSelectionChange: this.onSelectionChange,
    };

    return (
      <Fragment>
        <EuiBasicTable
          compressed
          items={rows}
          itemId="id"
          columns={columns}
          sorting={sorting}
          message="No workpads found"
          onChange={this.onTableChange}
          isSelectable
          selection={selection}
          style={{ minHeight: '356px' }} // exact height of 10 row page, prevents the modal from shrinking for partial pages
        />
        <EuiSpacer />
        <EuiFlexGroup gutterSize="none" justifyContent="flexEnd">
          <EuiFlexItem grow={false}>
            <EuiPagination activePage={pageNumber} onPageClick={setPage} pageCount={totalPages} />
          </EuiFlexItem>
        </EuiFlexGroup>
      </Fragment>
    );
  };

  render() {
    const {
      deletingWorkpad,
      createPending,
      selectedWorkpads,
      sortField,
      sortDirection,
    } = this.state;
    const isLoading = this.props.workpads == null;
    const modalTitle =
      selectedWorkpads.length === 1
        ? `Delete workpad '${selectedWorkpads[0].name}'?`
        : `Delete ${selectedWorkpads.length} workpads?`;

    const confirmModal = (
      <ConfirmModal
        isOpen={deletingWorkpad}
        title={modalTitle}
        message="You can't recover deleted workpads."
        confirmButtonText="Delete"
        onConfirm={this.removeWorkpads}
        onCancel={this.closeRemoveConfirm}
      />
    );

    let sortedWorkpads = [];

    if (!createPending && !isLoading) {
      const { workpads } = this.props.workpads;
      sortedWorkpads = sortByOrder(workpads, [sortField, '@timestamp'], [sortDirection, 'desc']);
    }

    return (
      <Paginate rows={sortedWorkpads}>
        {pagination => (
          <WorkpadUpload onUpload={this.uploadWorkpad}>
            <EuiTitle size="s">
              <h4>Workpads</h4>
            </EuiTitle>
            <EuiText>
              <p>
                <i>
                  Drag and drop a JSON file oto this area to load a previously built workpad as a
                  new file
                </i>
              </p>
            </EuiText>

            <EuiSpacer />

            <EuiFlexGroup gutterSize="s">
              {selectedWorkpads.length > 0 && (
                <Fragment>
                  <EuiFlexItem grow={false}>
                    <EuiButton
                      size="s"
                      color="secondary"
                      onClick={this.downloadWorkpads}
                      iconType="sortDown"
                    >
                      {`Download (${selectedWorkpads.length})`}
                    </EuiButton>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiButton
                      size="s"
                      color="danger"
                      iconType="trash"
                      onClick={this.openRemoveConfirm}
                    >
                      {`Delete (${selectedWorkpads.length})`}
                    </EuiButton>
                  </EuiFlexItem>
                </Fragment>
              )}
              <EuiFlexItem>
                <WorkpadSearch
                  onChange={text => {
                    pagination.setPage(0);
                    this.props.findWorkpads(text);
                  }}
                />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <WorkpadCreate createPending={createPending} onCreate={this.createWorkpad} />
              </EuiFlexItem>
            </EuiFlexGroup>

            <EuiSpacer />

            {createPending && <div>Creating Workpad...</div>}
            {!createPending && isLoading && <div>Fetching Workpads...</div>}
            {!createPending && !isLoading && this.renderWorkpadTable(pagination)}

            {confirmModal}
          </WorkpadUpload>
        )}
      </Paginate>
    );
  }
}
