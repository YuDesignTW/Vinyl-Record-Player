import { useTranslation } from "./i18n";
export function LibraryLoading({ loading }) {const { t: tr } = useTranslation();
  return <div className={`library-loading ${loading ? "is-loading" : "is-loaded"}`} aria-hidden={!loading}>
  <div className="library-loading-content" role="status" aria-live="polite" aria-atomic="true">
   <div className="loading-vinyl" aria-hidden="true"><span className="loading-vinyl-label"><i /></span></div>
   <span className="loading-brand" aria-hidden="true">OhMusic</span>
   <p>{tr("正在載入唱片庫…")}</p>
  </div>
 </div>;
}
