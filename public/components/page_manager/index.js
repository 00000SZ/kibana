import { connect } from 'react-redux';
import { compose, withState } from 'recompose';
import { addPage, loadPage, movePage, removePage, duplicatePage } from '../../state/actions/pages';
import { getSelectedPage, getPages } from '../../state/selectors/workpad';
import { PageManager as Component } from './page_manager';

const mapStateToProps = state => ({
  pages: getPages(state),
  selectedPage: getSelectedPage(state),
});

const mapDispatchToProps = dispatch => ({
  addPage: () => dispatch(addPage()),
  loadPage: id => dispatch(loadPage(id)),
  movePage: (id, position) => dispatch(movePage(id, position)),
  duplicatePage: id => dispatch(duplicatePage(id)),
  removePage: id => dispatch(removePage(id)),
});

export const PageManager = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withState('deleteId', 'setDeleteId', null)
)(Component);
