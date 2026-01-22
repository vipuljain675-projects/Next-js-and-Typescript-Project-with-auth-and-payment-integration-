import { Suspense } from 'react';
import PageContent from './PageContent';

export default function Home() {
  return (
    <Suspense fallback={
      <div className="text-center mt-5 pt-5" style={{ marginTop: "180px" }}>
        <div className="spinner-border text-danger" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    }>
      <PageContent />
    </Suspense>
  );
}