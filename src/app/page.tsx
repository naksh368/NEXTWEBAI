import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Hero } from "@/components/marketing/hero";
import {
  LaunchingSoon,
  HowItWorks,
  AgentBenefits,
  WalletPreview,
  ExpertzCredit,
} from "@/components/marketing/sections";
import { ButtonLink } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <LaunchingSoon />
        <HowItWorks />
        <AgentBenefits />
        <WalletPreview />
        <ExpertzCredit />

        {/* Closing CTA */}
        <section className="container pb-20">
          <div className="overflow-hidden rounded-2xl border border-surface-border bg-white p-8 text-center shadow-card sm:p-12 dot-grid">
            <h2 className="text-2xl font-extrabold sm:text-3xl">
              Ready to grow your <span className="text-blue">travel business</span>?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-[0.98rem] text-ink-muted">
              Join ExpertzTrip and book flights with competitive fares, a secure prepaid
              wallet and earnings you can actually see.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <ButtonLink href="/register" variant="accent" size="lg">
                Become an Agent <ArrowRight size={18} />
              </ButtonLink>
              <ButtonLink href="/login" variant="outline" size="lg">
                Login
              </ButtonLink>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
