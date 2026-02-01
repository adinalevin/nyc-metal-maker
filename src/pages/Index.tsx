import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/sections/HeroSection";
import { WhatWeMakeSection } from "@/components/sections/WhatWeMakeSection";
import { CustomPartsSection } from "@/components/sections/CustomPartsSection";
import { FileGuideSection } from "@/components/sections/FileGuideSection";
import { ReorderSection } from "@/components/sections/ReorderSection";
import { FAQSection } from "@/components/sections/FAQSection";
import { ContactSection } from "@/components/sections/ContactSection";
import { useRedirects } from "@/hooks/useSupabaseData";
import { FormExclusionProvider } from "@/contexts/FormExclusionContext";

const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: redirects } = useRedirects();

  // Handle redirects
  useEffect(() => {
    if (redirects && redirects.length > 0) {
      const redirect = redirects.find((r) => r.from_path === location.pathname);
      if (redirect) {
        navigate(redirect.to_path, { replace: redirect.is_permanent });
      }
    }
  }, [redirects, location.pathname, navigate]);

  // Handle hash scrolling on load
  useEffect(() => {
    if (location.hash) {
      const element = document.querySelector(location.hash);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }
  }, [location.hash]);

  return (
    <FormExclusionProvider>
      <div className="min-h-screen bg-background">
        <Header />
        <main>
          <HeroSection />
          <WhatWeMakeSection />
          <CustomPartsSection />
          <FileGuideSection />
          <ReorderSection />
          <FAQSection />
          <ContactSection />
        </main>
        <Footer />
      </div>
    </FormExclusionProvider>
  );
};

export default Index;
