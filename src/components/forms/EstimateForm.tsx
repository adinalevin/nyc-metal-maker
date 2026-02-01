import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Upload, X, CheckCircle2, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUiCopy, useOfferings } from "@/hooks/useSupabaseData";

const estimateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email").max(255),
  company: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  callbackRequested: z.boolean().default(false),
  preferredMethod: z.enum(["call", "text"]).optional(),
  bestTime: z.enum(["morning", "midday", "afternoon", "asap"]).optional(),
  offering: z.string().optional(),
  material: z.string().optional(),
  thickness: z.string().optional(),
  customThickness: z.string().optional(),
  quantity: z.string().optional(),
  finish: z.string().optional(),
  neededBy: z.string().optional(),
  deliveryMethod: z.enum(["pickup", "courier", "ship"]).optional(),
  deliveryZip: z.string().max(10).optional(),
  addons: z.array(z.string()).default([]),
  notes: z.string().max(2000).optional(),
  fileLink: z.string().url().optional().or(z.literal("")),
}).refine(
  (data) => !data.callbackRequested || data.phone,
  { message: "Phone is required for callback", path: ["phone"] }
);

type EstimateFormData = z.infer<typeof estimateSchema>;

const materials = [
  "A36 Steel",
  "A572 Grade 50",
  "Stainless 304",
  "Stainless 316",
  "Aluminum 6061",
  "Galvanized",
  "Other / Not sure",
];

const thicknesses = [
  '1/8" (0.125)',
  '3/16" (0.1875)',
  '1/4" (0.25)',
  '5/16" (0.3125)',
  '3/8" (0.375)',
  '1/2" (0.5)',
  '5/8" (0.625)',
  '3/4" (0.75)',
  '1" (1.0)',
  "Custom",
];

const finishes = [
  "Mill finish",
  "Paint",
  "Powder coat",
  "Galvanize",
  "Not sure",
];

const addonOptions = [
  { id: "cad-cleanup", label: "CAD file cleanup / file prep" },
  { id: "detailing", label: "Detailing support (shop-ready drawings if needed)" },
  { id: "dfm-review", label: "DFM review" },
  { id: "drilling", label: "Drilling / tapping / countersink" },
  { id: "deburr-standard", label: "Deburr / edge finish: standard" },
  { id: "deburr-install", label: "Deburr / edge finish: install-ready" },
  { id: "deburr-finish", label: "Deburr / edge finish: finish-ready" },
  { id: "welding", label: "Welding / fit-up" },
];

function generateJobReference(): string {
  const year = new Date().getFullYear();
  const num = Math.floor(1000 + Math.random() * 9000);
  return `MP-${year}-${num}`;
}

export function EstimateForm() {
  const { data: uiCopy } = useUiCopy();
  const { data: offerings } = useOfferings();
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [jobReference, setJobReference] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EstimateFormData>({
    resolver: zodResolver(estimateSchema),
    defaultValues: {
      callbackRequested: false,
      addons: [],
    },
  });

  const callbackRequested = watch("callbackRequested");
  const deliveryMethod = watch("deliveryMethod");
  const thickness = watch("thickness");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selectedFiles].slice(0, 10));
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: EstimateFormData) => {
    setIsSubmitting(true);
    
    // Simulate API call - in production, this would save to Supabase
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    const ref = generateJobReference();
    setJobReference(ref);
    setIsSuccess(true);
    setIsSubmitting(false);
    
    console.log("Estimate submitted:", { ...data, files, jobReference: ref });
  };

  if (isSuccess) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8 text-accent" />
        </div>
        <h3 className="font-display text-2xl font-bold text-foreground mb-2">
          Thanks — your request is Received
        </h3>
        <p className="text-muted-foreground mb-4">
          We're evaluating your files and specs now.
        </p>
        <div className="inline-block px-4 py-2 bg-secondary rounded-lg">
          <span className="text-sm text-muted-foreground">Job Reference: </span>
          <span className="font-mono font-semibold text-foreground">{jobReference}</span>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Contact Info */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            {...register("name")}
            className="input-industrial"
            placeholder="Your name"
          />
          {errors.name && (
            <p className="text-destructive text-sm">{errors.name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            className="input-industrial"
            placeholder="you@company.com"
          />
          {errors.email && (
            <p className="text-destructive text-sm">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="company">Company</Label>
          <Input
            id="company"
            {...register("company")}
            className="input-industrial"
            placeholder="Company name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone {callbackRequested && "*"}</Label>
          <Input
            id="phone"
            {...register("phone")}
            className="input-industrial"
            placeholder="(555) 555-1234"
          />
          {errors.phone && (
            <p className="text-destructive text-sm">{errors.phone.message}</p>
          )}
        </div>
      </div>

      {/* Callback */}
      <div className="space-y-4 p-4 bg-secondary/50 rounded-lg">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="callback"
            checked={callbackRequested}
            onCheckedChange={(checked) => setValue("callbackRequested", !!checked)}
          />
          <Label htmlFor="callback" className="cursor-pointer">
            Request a callback
          </Label>
        </div>

        {callbackRequested && (
          <div className="grid sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <Label>Preferred method</Label>
              <Select onValueChange={(v) => setValue("preferredMethod", v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Call or text" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Best time</Label>
              <Select onValueChange={(v) => setValue("bestTime", v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="When to reach you" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning (8am-12pm)</SelectItem>
                  <SelectItem value="midday">Midday (12pm-3pm)</SelectItem>
                  <SelectItem value="afternoon">Afternoon (3pm-6pm)</SelectItem>
                  <SelectItem value="asap">ASAP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* Part Details */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>What do you need?</Label>
          <Select onValueChange={(v) => setValue("offering", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {(offerings || []).map((o) => (
                <SelectItem key={o.slug} value={o.slug}>
                  {o.name}
                </SelectItem>
              ))}
              <SelectItem value="other">Other / Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Material</Label>
          <Select onValueChange={(v) => setValue("material", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select material" />
            </SelectTrigger>
            <SelectContent>
              {materials.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Thickness</Label>
          <Select onValueChange={(v) => setValue("thickness", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {thicknesses.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {thickness === "Custom" && (
            <Input
              {...register("customThickness")}
              className="input-industrial mt-2"
              placeholder="Enter thickness"
            />
          )}
        </div>
        <div className="space-y-2">
          <Label>Quantity</Label>
          <Input
            {...register("quantity")}
            className="input-industrial"
            placeholder="e.g., 50"
          />
        </div>
        <div className="space-y-2">
          <Label>Finish</Label>
          <Select onValueChange={(v) => setValue("finish", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
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
        </div>
      )}

      {/* Add-ons */}
      <div className="space-y-3">
        <Label>Add-ons</Label>
        <div className="grid sm:grid-cols-2 gap-2">
          {addonOptions.map((addon) => (
            <div key={addon.id} className="flex items-center space-x-2">
              <Checkbox
                id={addon.id}
                onCheckedChange={(checked) => {
                  const current = watch("addons");
                  if (checked) {
                    setValue("addons", [...current, addon.id]);
                  } else {
                    setValue("addons", current.filter((a) => a !== addon.id));
                  }
                }}
              />
              <Label htmlFor={addon.id} className="cursor-pointer text-sm">
                {addon.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          {...register("notes")}
          className="input-industrial min-h-[100px]"
          placeholder="Any additional details or special requirements..."
        />
      </div>

      {/* File Upload */}
      <div className="space-y-3">
        <Label>Upload Files</Label>
        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-accent transition-colors">
          <input
            type="file"
            multiple
            accept=".dxf,.dwg,.step,.stp,.pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Drag files here or click to browse
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              DXF, DWG, STEP, PDF, JPG, PNG
            </p>
          </label>
        </div>

        {files.length > 0 && (
          <ul className="space-y-2">
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

        <div className="text-center text-sm text-muted-foreground">or</div>

        <div className="space-y-2">
          <Label htmlFor="fileLink">File Link</Label>
          <Input
            id="fileLink"
            {...register("fileLink")}
            className="input-industrial"
            placeholder="https://drive.google.com/..."
          />
        </div>
      </div>

      {/* Submit */}
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
          uiCopy?.cta_get_estimate || "Get an Estimate"
        )}
      </Button>
    </form>
  );
}
