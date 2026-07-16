import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const Pagination = ({ page, pages, total, onPageChange }) => {
  if (!pages || pages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
      <p className="text-sm text-slate-500">
        Page <span className="font-semibold text-slate-700">{page}</span> of{' '}
        <span className="font-semibold text-slate-700">{pages}</span> &middot; {total} total records
      </p>
      <div className="flex gap-2">
        <button
          className="btn-outline !px-3 !py-1.5"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <FiChevronLeft size={16} />
        </button>
        <button
          className="btn-outline !px-3 !py-1.5"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
        >
          <FiChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
