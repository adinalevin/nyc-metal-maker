import { EstimateForm } from "@/components/forms/EstimateForm";

export function FileGuideSection() {
  return (
    <section id="file-guide" className="py-20 sm:py-28 bg-background">
      <div className="section-container">
        <div className="max-w-3xl mx-auto">
          <div className="card-industrial p-6 sm:p-8">
            <EstimateForm />
          </div>
        </div>
      </div>
    </section>
  );
}
