import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Upload, X, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUiCopy } from "@/hooks/useSupabaseData";
import { submitOrder } from "@/lib/orderSubmission";

const reorderSchema = z.object({
  email: z.string().email("Invalid email").max(255),
  partId: z.string().min(1, "Part ID is required").max(50),
  revision: z.string().max(20).optional(),
  quantity: z.string().min(1, "Quantity is required"),
  finish: z.string().optional(),
  neededBy: z.string().optional(),
  deliveryMethod: z.enum(["pickup", "courier", "ship"]).optional(),
  deliveryZip: z.string().max(10).optional(),
}).refine(
  (data) => {
    if (data.deliveryMethod === "courier" || data.deliveryMethod === "ship") {
      return !!data.deliveryZip;
    }
    return true;
  },
  { message: "ZIP is required for delivery", path: ["deliveryZip"] }
);

type ReorderFormData = z.infer<typeof reorderSchema>;

const finishes = [
  "Mill finish",
  "Paint",
  "Powder coat",
  "Galvanize",
  "Same as before",
];

export function ReorderSection() {
  const { data: uiCopy } = useUiCopy();
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [uploadFailed, setUploadFailed] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ReorderFormData>({
    resolver: zodResolver(reorderSchema),
  });

  const deliveryMethod = watch("deliveryMethod");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selectedFiles].slice(0, 5));
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ReorderFormData) => {
    setIsSubmitting(true);
    setUploadFailed(false);
    
    const result = await submitOrder(
      {
        request_type: "Reorder",
        status: "In Estimating",
        customer_email: data.email,
        part_id: data.partId,
        revision: data.revision,
        quantity: data.quantity,
        finish: data.finish,
        needed_by: data.neededBy,
        delivery_method: data.deliveryMethod,
        delivery_zip: data.deliveryZip,
      },
      files
    );
    
    setIsSubmitting(false);
    
    if (result.success && result.orderId) {
      setOrderId(result.orderId);
      setUploadFailed(result.uploadFailed || false);
      setIsSuccess(true);
    } else {
      console.error("Reorder submission failed:", result.error);
    }
  };

  const partIdLabel = uiCopy?.label_part_id || "Part ID";
  const revisionLabel = uiCopy?.label_revision || "Revision";
  const ctaLabel = uiCopy?.cta_reorder || "Reorder a Part";

  if (isSuccess) {
    return (
      <section id="reorder" className="py-20 sm:py-28 bg-muted/30">
        <div className="section-container">
          <div className="max-w-xl mx-auto text-center">
            <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-accent" />
            </div>
            <h3 className="font-display text-2xl font-bold text-foreground mb-2">
              Order Received
            </h3>
            <p className="text-muted-foreground mb-4">
              Status: In Estimating
            </p>
            <div className="inline-block px-4 py-2 bg-secondary rounded-lg">
              <span className="text-sm text-muted-foreground">Order ID: </span>
              <span className="font-mono font-semibold text-foreground">{orderId}</span>
            </div>
            {uploadFailed && (
              <p className="text-destructive text-sm mt-4">
                Order created; file upload failed — please retry.
              </p>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="reorder" className="py-20 sm:py-28 bg-muted/30">
      <div className="section-container">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
              {ctaLabel}
            </h2>
            <p className="text-muted-foreground">
              Already have a part on file? Enter your Part ID and we'll pull your specs.
            </p>
          </div>

          {/* Form */}
          <div className="card-industrial p-6 sm:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="reorder-email">Email *</Label>
                <Input
                  id="reorder-email"
                  type="email"
                  {...register("email")}
                  className="input-industrial"
                  placeholder="you@company.com"
                />
                {errors.email && (
                  <p className="text-destructive text-sm">{errors.email.message}</p>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="partId">{partIdLabel} *</Label>
                  <Input
                    id="partId"
                    {...register("partId")}
                    className="input-industrial font-mono"
                    placeholder="e.g., BP-2024-0142"
                  />
                  {errors.partId && (
                    <p className="text-destructive text-sm">{errors.partId.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="revision">{revisionLabel}</Label>
                  <Input
                    id="revision"
                    {...register("revision")}
                    className="input-industrial font-mono"
                    placeholder="e.g., A, B, 2"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reorder-quantity">Quantity *</Label>
                  <Input
                    id="reorder-quantity"
                    {...register("quantity")}
                    className="input-industrial"
                    placeholder="e.g., 25"
                  />
                  {errors.quantity && (
                    <p className="text-destructive text-sm">{errors.quantity.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Finish</Label>
                  <Select onValueChange={(v) => setValue("finish", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select finish" />
                    </SelectTrigger>
                    <SelectContent>
                      {finishes.map((f) => (
                        <SelectItem key={f} value={f}>
                          {f}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Needed by</Label>
                  <Input
                    type="date"
                    {...register("neededBy")}
                    className="input-industrial"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pickup / Delivery</Label>
                  <Select onValueChange={(v) => setValue("deliveryMethod", v as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pickup">Pickup</SelectItem>
                      <SelectItem value="courier">Courier</SelectItem>
                      <SelectItem value="ship">Ship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {(deliveryMethod === "courier" || deliveryMethod === "ship") && (
                <div className="space-y-2">
                  <Label>Delivery ZIP *</Label>
                  <Input
                    {...register("deliveryZip")}
                    className="input-industrial max-w-xs"
                    placeholder="e.g., 11237"
                  />
                  {errors.deliveryZip && (
                    <p className="text-destructive text-sm">{errors.deliveryZip.message}</p>
                  )}
                </div>
              )}

              {/* Optional file upload */}
              <div className="space-y-2">
                <Label>Updated file (optional)</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-accent transition-colors">
                  <input
                    type="file"
                    multiple
                    accept=".dxf,.dwg,.step,.stp,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    id="reorder-file-upload"
                  />
                  <label htmlFor="reorder-file-upload" className="cursor-pointer">
                    <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                    <p className="text-sm text-muted-foreground">
                      Upload revised files if needed
                    </p>
                  </label>
                </div>

                {files.length > 0 && (
                  <ul className="space-y-2 mt-2">
                    {files.map((file, index) => (
                      <li
                        key={index}
                        className="flex items-center justify-between p-2 bg-secondary rounded"
                      >
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-muted-foreground" />
                          <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X size={16} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  ctaLabel
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
