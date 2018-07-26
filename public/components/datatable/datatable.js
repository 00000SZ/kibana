import React from 'react';
import { Table } from 'react-bootstrap';
import { EuiTextColor } from '@elastic/eui';
import PropTypes from 'prop-types';
import moment from 'moment';
import { Paginate } from '../paginate';
import { PaginateControls } from '../paginate_controls';

const getIcon = type => {
  if (type === null) return;

  switch (type) {
    case 'string':
      return <strong>a</strong>;
    case 'number':
      return <strong>#</strong>;
    case 'date':
      return <i className="fa fa-calendar" />;
    case 'boolean':
      return <strong>t</strong>;
    default:
      return <strong>?</strong>;
  }
};

const getColumnName = col => (typeof col === 'string' ? col : col.name);

const getColumnType = col => col.type || null;

const getFormattedValue = (val, type) => {
  if (type === 'date') return moment(val).format();
  return String(val);
};

export const Datatable = ({ datatable, perPage, paginate, showHeader }) => (
  <Paginate rows={datatable.rows} perPage={perPage || 10}>
    {({
      rows,
      nextPage,
      prevPage,
      setPage,
      prevPageEnabled,
      nextPageEnabled,
      pageNumber,
      totalPages,
    }) => (
      <div className="canvasDataTable">
        <div style={{ flexGrow: 1 }}>
          <Table condensed>
            {!showHeader ? null : (
              <thead>
                <tr>
                  {datatable.columns.map(col => (
                    <th key={`header-${getColumnName(col)}`}>
                      {getColumnName(col)}{' '}
                      <EuiTextColor color="subdued">{getIcon(getColumnType(col))}</EuiTextColor>
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  {datatable.columns.map(col => (
                    <td key={`row-${i}-${getColumnName(col)}`}>
                      {getFormattedValue(row[getColumnName(col)], getColumnType(col))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </Table>
        </div>

        {paginate && (
          <PaginateControls
            prevPage={prevPage}
            prevPageEnabled={prevPageEnabled}
            setPage={setPage}
            pageNumber={pageNumber}
            totalPages={totalPages}
            nextPage={nextPage}
            nextPageEnabled={nextPageEnabled}
          />
        )}
      </div>
    )}
  </Paginate>
);

Datatable.propTypes = {
  datatable: PropTypes.object.isRequired,
  perPage: PropTypes.number,
  paginate: PropTypes.bool,
  showHeader: PropTypes.bool,
};
