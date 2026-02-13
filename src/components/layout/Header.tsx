import { useState, useEffect } from "react";
import { Menu, X, User } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useUiCopy } from "@/hooks/useSupabaseData";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "#what-we-make", labelKey: null, label: "What We Make" },
  { href: "#custom-parts", labelKey: "nav_offers_label", label: "Custom Parts" },
  { href: "#file-guide", labelKey: null, label: "File Guide" },
  { href: "#reorder", labelKey: null, label: "Reorder" },
  { href: "#faq", labelKey: null, label: "FAQ" },
  { href: "#contact", labelKey: null, label: "Contact" },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: uiCopy } = useUiCopy();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getNavLabel = (item: typeof navItems[0]) => {
    if (item.labelKey && uiCopy?.[item.labelKey]) {
      return uiCopy[item.labelKey];
    }
    return item.label;
  };

  const handleNavClick = (href: string) => {
    setIsMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-background/95 backdrop-blur-md shadow-md py-3"
          : "bg-transparent py-5"
      )}
    >
      <div className="section-container">
        <nav className="flex items-center justify-between">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-steel-gradient rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-lg">M</span>
            </div>
            <div className="hidden sm:block">
              <span className="font-display font-bold text-lg text-foreground">Metal Parts</span>
              <span className="text-muted-foreground text-sm ml-1">NYC</span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <ul className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <button
                  onClick={() => handleNavClick(item.href)}
                  className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/50"
                >
                  {getNavLabel(item)}
                </button>
              </li>
            ))}
          </ul>

          {/* CTA Button */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/status" className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/50">
              <User className="w-4 h-4" />
              My Requests
            </Link>
            <Button
              variant="hero"
              size="default"
              onClick={() => handleNavClick("#file-guide")}
            >
              {uiCopy?.cta_get_estimate || "Get an Estimate"}
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden p-2 text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-background border-b border-border shadow-lg animate-fade-in">
            <ul className="section-container py-4 space-y-1">
              {navItems.map((item) => (
                <li key={item.href}>
                  <button
                    onClick={() => handleNavClick(item.href)}
                    className="w-full text-left px-4 py-3 text-base font-medium text-foreground hover:bg-muted/50 rounded-md transition-colors"
                  >
                    {getNavLabel(item)}
                  </button>
                </li>
              ))}
              <li className="pt-2 space-y-2">
                <Link
                  to="/status"
                  className="flex items-center gap-2 w-full px-4 py-3 text-base font-medium text-foreground hover:bg-muted/50 rounded-md transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <User className="w-4 h-4" />
                  My Requests
                </Link>
                <Button
                  variant="hero"
                  className="w-full"
                  onClick={() => handleNavClick("#file-guide")}
                >
                  {uiCopy?.cta_get_estimate || "Get an Estimate"}
                </Button>
              </li>
            </ul>
          </div>
        )}
      </div>
    </header>
  );
}
