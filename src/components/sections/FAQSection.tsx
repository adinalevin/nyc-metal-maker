import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What file formats do you accept?",
    answer:
      "We accept DXF, DWG, STEP, and PDF files. If you only have a pencil sketch, you can upload a JPG or PNG and we'll evaluate it. Revit exports are supported—see our File Guide for details.",
  },
  {
    question: "What's the typical turnaround time?",
    answer:
      "Standard turnaround is 2–5 business days from quote approval. Rush lane is available for time-sensitive projects—let us know your deadline and we'll work to accommodate it.",
  },
  {
    question: "What's your service area?",
    answer:
      "We serve NYC and the surrounding 100-mile radius. Pickup is available at our Brooklyn location, and we offer courier delivery throughout the metro area. Shipping is available nationwide.",
  },
  {
    question: "Do you do one-offs or only production runs?",
    answer:
      "Both! We support prototype-to-production runs. Whether you need a single prototype or 500 pieces, we can handle it.",
  },
  {
    question: "Can you work from hand sketches?",
    answer:
      "Yes. Upload a clear photo or scan of your sketch and we'll evaluate it. If CAD file prep is needed, we offer that as an add-on service.",
  },
  {
    question: "What materials do you work with?",
    answer:
      "We work with A36 and A572 structural steel, stainless steel (304 and 316), aluminum (6061), and galvanized sheet. Let us know if you have specific material requirements.",
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="py-20 sm:py-28 bg-background">
      <div className="section-container">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground text-center mb-12">
            Frequently Asked Questions
          </h2>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`faq-${index}`}
                className="card-industrial px-6 border-0"
              >
                <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
