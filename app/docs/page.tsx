import Link from "next/link";
import { DocsNav } from "@/components/docs-legal/DocsNav";
import { HeroSection } from "@/components/docs/HeroSection";
import { DocsSidebar } from "@/components/docs/DocsSidebar";
import {
  AiDocsSection,
  ApiExamplesSection,
  ApiReferenceSection,
  ChangelogSection,
  ConceptsSection,
  DeploymentSection,
  ErrorsSection,
  FrontendIntegrationSection,
  GlossarySection,
  LlmRuntimeSection,
  ProductFlowSection,
  QuickstartSection,
  SafetySection,
  SecuritySection,
  StatusReadinessSection,
} from "@/components/docs/sections";
import styles from "@/components/docs-legal/DocsLegal.module.css";

export default function DocsPage() {
  return (
    <div className={styles.page}>
      <DocsNav
        active="Docs"
        links={[{ label: "Status", href: "/status" }]}
        cta={{ label: "Start run", href: "/run" }}
        maxWidth={1160}
      />

      <div className={styles.wrap} style={{ maxWidth: 1160 }}>
        <HeroSection />

        <div className={styles.docsLayout}>
          <DocsSidebar />

          <div className={styles.contentCol}>
            <QuickstartSection />
            <ConceptsSection />
            <ProductFlowSection />
            <LlmRuntimeSection />
            <ApiReferenceSection />
            <ApiExamplesSection />
            <FrontendIntegrationSection />
            <SafetySection />
            <ErrorsSection />
            <StatusReadinessSection />
            <DeploymentSection />
            <SecuritySection />
            <ChangelogSection />
            <GlossarySection />
            <AiDocsSection />
          </div>
        </div>

        <div className={styles.footer}>
          <span>Sealrail on Casper</span>
          <span className={styles.footerLinks}>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </span>
        </div>
      </div>
    </div>
  );
}
