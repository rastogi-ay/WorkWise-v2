import '../styles/PageLoading.css';

export function PageLoading() {
  return (
    <div className="page-loading">
      <span className="page-loading__spinner" role="status" aria-label="Loading" />
    </div>
  );
}
