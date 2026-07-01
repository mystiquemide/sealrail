import { Hero } from "@/components/landing/Hero";
import { ProductFamily } from "@/components/landing/ProductFamily";
import { ProofFlow } from "@/components/landing/ProofFlow";
import { ScaleStrip } from "@/components/landing/ScaleStrip";
import { FirstVertical } from "@/components/landing/FirstVertical";
import { ProofExplorerPreview } from "@/components/landing/ProofExplorerPreview";
import { TeeVerification } from "@/components/landing/TeeVerification";
import { FinalCta } from "@/components/landing/FinalCta";
import { Footer } from "@/components/landing/Footer";
import styles from "@/components/landing/Landing.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <Hero />
      <ProductFamily />
      <ProofFlow />
      <ScaleStrip />
      <FirstVertical />
      <ProofExplorerPreview />
      <TeeVerification />
      <FinalCta />
      <Footer />
    </div>
  );
}
