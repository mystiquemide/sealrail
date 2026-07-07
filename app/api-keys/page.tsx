import { AppNav } from "@/components/app/AppNav";
import { EmptyState } from "@/components/app/EmptyState";
import styles from "@/components/api-keys/ApiKeys.module.css";

export default function ApiKeysPage() {
  return (
    <div className={styles.page}>
      <AppNav active="API keys" maxWidth={1040} links={[{ label: "Docs", href: "/docs" }, { label: "Run demo", href: "/run" }]} cta={null} />
      <main id="main" tabIndex={-1} className={styles.wrap}>
        <EmptyState
          title="API key management is private"
          body="Public demo browsers no longer mint or store API keys. Use backend-managed demo runs from /run, or manage production API keys from a private operator session."
          actionLabel="Run public demo"
          actionHref="/run"
        />
      </main>
    </div>
  );
}
