export function LibraryLoading({loading}){
 return <div className={`library-loading ${loading?'is-loading':'is-loaded'}`} aria-hidden={!loading}>
  <div className="library-loading-content" role="status" aria-live="polite" aria-atomic="true">
   <div className="loading-vinyl" aria-hidden="true"><span className="loading-vinyl-label"><i/></span></div>
   <span className="loading-brand" aria-hidden="true">hdame</span>
   <p>正在載入唱片庫…</p>
  </div>
 </div>;
}
