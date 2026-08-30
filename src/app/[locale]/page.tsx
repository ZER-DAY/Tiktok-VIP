import { setRequestLocale } from "next-intl/server";
import { Navbar } from "@/components/landing/navbar";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { SocialProofSection } from "@/components/landing/social-proof-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { Footer } from "@/components/landing/footer";

export default async function LocalePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <SocialProofSection />
        <FeaturesSection />
        <div className="px-4 pb-20 pt-[13px] sm:px-6">
          <div
            data-testid="landing-lower-grid"
            className="mx-auto grid w-full max-w-[1275px] items-stretch gap-3 lg:grid-cols-[1.15fr_.9fr] xl:w-[83.0078125vw] xl:-translate-x-[4.5px]"
          >
            <PricingSection />
            <HowItWorksSection />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
