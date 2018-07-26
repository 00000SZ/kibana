import React from 'react';
import PropTypes from 'prop-types';

const showPages = ({ setPage, pageNumber, totalPages }) => {
  const pages = [];

  for (let i = 1; i <= totalPages; i++) {
    if (i === pageNumber)
      pages.push(
        <span key={`pageNumber${i}`} className="canvasPaginate__number active">
          {i}
        </span>
      );
    else {
      pages.push(
        <button
          key={`pageNumber${i}`}
          className="btn btn-link canvasPaginate__number"
          onClick={() => setPage(i)}
        >
          {i}
        </button>
      );
    }
  }

  return pages;
};

export const PaginateControls = ({
  prevPage,
  prevPageEnabled,
  setPage,
  pageNumber,
  totalPages,
  nextPage,
  nextPageEnabled,
}) => (
  <div className="canvasPaginate__controls">
    {prevPageEnabled && (
      <button className="btn btn-link canvasPaginate__nav" onClick={prevPage}>
        <i className="fa fa-angle-left" />
      </button>
    )}
    {showPages({ setPage, pageNumber, totalPages })}
    {nextPageEnabled && (
      <button className="btn btn-link canvasPaginate__nav" onClick={nextPage}>
        <i className="fa fa-angle-right" />
      </button>
    )}
  </div>
);

PaginateControls.propTypes = {
  pageNumber: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  setPage: PropTypes.func.isRequired,
  prevPage: PropTypes.func.isRequired,
  nextPage: PropTypes.func.isRequired,
  prevPageEnabled: PropTypes.bool.isRequired,
  nextPageEnabled: PropTypes.bool.isRequired,
};
