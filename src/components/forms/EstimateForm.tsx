import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Upload, X, CheckCircle2, FileText, Loader2, ChevronDown, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useUiCopy, useOfferings } from "@/hooks/useSupabaseData";
import { cn } from "@/lib/utils";
import { submitOrder } from "@/lib/orderSubmission";
import { useFormExclusion } from "@/contexts/FormExclusionContext";

// Offerings that require laser (we supply material for safety)
const LASER_OFFERING_SLUGS = ["pop-flat", "proto-sprint"];

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
  materialSourcing: z.enum(["customer", "we-supply"]),
  materialSpecDetails: z.string().max(2000).optional(),
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


export function EstimateForm() {
  const { data: uiCopy } = useUiCopy();
  const { data: offerings } = useOfferings();
  const { activeForm, openEstimateForm } = useFormExclusion();
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [uploadFailed, setUploadFailed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [fileLink, setFileLink] = useState("");
  const uploadAreaRef = useRef<HTMLDivElement>(null);
  const confirmationRef = useRef<HTMLDivElement>(null);

  const [receivingGuidelinesOpen, setReceivingGuidelinesOpen] = useState(false);

  // Sync with mutual exclusion context
  const shouldBeOpen = activeForm === "estimate";
  useEffect(() => {
    if (shouldBeOpen && !isExpanded) {
      setIsExpanded(true);
    } else if (!shouldBeOpen && isExpanded && !isSuccess) {
      setIsExpanded(false);
    }
  }, [shouldBeOpen, isExpanded, isSuccess]);

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
      materialSourcing: "we-supply",
    },
  });

  const callbackRequested = watch("callbackRequested");
  const deliveryMethod = watch("deliveryMethod");
  const thickness = watch("thickness");
  const selectedOffering = watch("offering");
  const materialSourcing = watch("materialSourcing");

  // Check if the selected offering includes laser work
  const includesLaser = selectedOffering ? LASER_OFFERING_SLUGS.includes(selectedOffering) : false;

  // Auto-set material sourcing to "we-supply" when laser is selected
  useEffect(() => {
    if (includesLaser && materialSourcing !== "we-supply") {
      setValue("materialSourcing", "we-supply");
    }
  }, [includesLaser, materialSourcing, setValue]);

  // Auto-expand when file is uploaded
  useEffect(() => {
    if (files.length > 0) {
      setIsExpanded(true);
    }
  }, [files.length]);

  // Listen for focus event from hero CTA
  useEffect(() => {
    const handleFocusUpload = () => {
      uploadAreaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      // Focus the file input label after scroll
      setTimeout(() => {
        const fileInput = document.getElementById("file-upload");
        if (fileInput) {
          fileInput.focus();
        }
      }, 500);
    };

    window.addEventListener("focus-estimate-upload", handleFocusUpload);
    return () => window.removeEventListener("focus-estimate-upload", handleFocusUpload);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selectedFiles].slice(0, 10));
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleContinue = () => {
    openEstimateForm();
    setIsExpanded(true);
  };

  const hasFileOrLink = files.length > 0 || fileLink.trim().length > 0;

  const onSubmit = async (data: EstimateFormData) => {
    setIsSubmitting(true);
    setUploadFailed(false);
    
    // Build material sourcing info for notes
    const materialSourcingText = data.materialSourcing === "customer" 
      ? "Material sourcing: Customer supplies" 
      : "Material sourcing: We supply";
    const materialSpecText = data.materialSourcing === "we-supply" && data.materialSpecDetails 
      ? `\nMaterial spec details: ${data.materialSpecDetails}` 
      : "";
    
    // Append material sourcing info to notes
    const enhancedNotes = [data.notes, materialSourcingText, materialSpecText]
      .filter(Boolean)
      .join("\n")
      .trim();
    
    const result = await submitOrder(
      {
        request_type: "Estimate",
        status: "In Estimating",
        customer_email: data.email,
        customer_name: data.name,
        company: data.company,
        customer_phone: data.phone,
        offering: data.offering,
        material: data.material,
        thickness: data.thickness,
        custom_thickness: data.customThickness,
        quantity: data.quantity,
        finish: data.finish,
        material_sourcing: data.materialSourcing,
        material_spec_details: data.materialSpecDetails,
        addons: data.addons,
        callback_requested: data.callbackRequested,
        preferred_method: data.preferredMethod,
        best_time: data.bestTime,
        needed_by: data.neededBy,
        delivery_method: data.deliveryMethod,
        delivery_zip: data.deliveryZip,
        file_link: fileLink || data.fileLink,
        notes: enhancedNotes,
      },
      files
    );
    
    setIsSubmitting(false);
    
    if (result.success && result.orderId) {
      setOrderId(result.orderId);
      setCustomerEmail(data.email);
      setUploadFailed(result.uploadFailed || false);
      setIsSuccess(true);
      
      // Scroll to confirmation after state update
      setTimeout(() => {
        const confirmEl = confirmationRef.current;
        if (confirmEl) {
          confirmEl.scrollIntoView({ behavior: "smooth", block: "start" });
          setTimeout(() => {
            window.scrollBy(0, -120);
            confirmEl.focus();
          }, 400);
        }
      }, 50);
    } else {
      console.error("Submission failed:", result.error);
    }
  };

  if (isSuccess) {
    return (
      <div 
        id="estimate-confirmation" 
        ref={confirmationRef}
        tabIndex={-1}
        className="text-center py-12 focus:outline-none"
      >
        <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8 text-accent" />
        </div>
        <h3 className="font-display text-2xl font-bold text-foreground mb-4">
          Thank You!
        </h3>
        <div className="max-w-md mx-auto space-y-4 text-left">
          <p className="text-foreground">
            Your confirmation number is{" "}
            <span className="font-mono font-semibold">{orderId}</span>.
          </p>
          <p className="text-muted-foreground">
            We're reviewing your files now and will follow up shortly with an estimate or any questions we need to finalize it.
          </p>
          <p className="text-muted-foreground">
            We just sent a confirmation email to{" "}
            <span className="font-medium text-foreground">{customerEmail}</span>.
          </p>
          <p className="text-sm text-muted-foreground">
            Check your inbox — if you don't see it, look in spam/promotions and mark it <span className="italic">Not spam</span>.
          </p>
        </div>
        {uploadFailed && (
          <p className="text-destructive text-sm mt-4">
            Order created; file upload failed — please retry.
          </p>
        )}
      </div>
    );
  }

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      {/* Header Row */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display text-xl font-bold text-foreground">
            Get an Estimate
          </h3>
          <p className="text-sm text-muted-foreground">
            Upload files + a few details. We'll evaluate and follow up.
          </p>
        </div>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
            aria-label={isExpanded ? "Collapse form" : "Expand form"}
          >
            <ChevronDown
              className={cn(
                "w-5 h-5 text-muted-foreground transition-transform duration-200",
                isExpanded && "rotate-180"
              )}
            />
          </button>
        </CollapsibleTrigger>
      </div>

      {/* Always Visible: Accepted Formats + Upload */}
      <div className="space-y-4" ref={uploadAreaRef}>
        {/* Accepted Formats Message */}
        <p className="text-sm text-muted-foreground">
          Accepted: DXF, DWG, STEP, PDF. If you only have a pencil sketch, upload a JPG/PNG or PDF and we'll evaluate it.
        </p>

        {/* File Upload */}
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

        {/* Uploaded Files List */}
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

        {/* File Link */}
        <div className="space-y-2">
          <Label htmlFor="fileLink" className="text-sm text-muted-foreground">
            Or add a link instead
          </Label>
          <Input
            id="fileLink"
            value={fileLink}
            onChange={(e) => {
              setFileLink(e.target.value);
              setValue("fileLink", e.target.value);
            }}
            className="input-industrial"
            placeholder="https://drive.google.com/..."
          />
        </div>

        {/* Continue Button (only when collapsed) */}
        {!isExpanded && (
          <Button
            type="button"
            variant="hero"
            size="lg"
            className="w-full"
            disabled={!hasFileOrLink}
            onClick={handleContinue}
          >
            Continue
          </Button>
        )}
      </div>

      {/* Expandable Form Fields */}
      <CollapsibleContent className="mt-6">
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

          {/* Material Sourcing - Required */}
          <div className="space-y-4 p-4 bg-secondary/50 rounded-lg">
            <div className="space-y-3">
              <Label className="text-base font-medium">
                Will you be supplying the material, or would you like us to supply it? *
              </Label>
              <RadioGroup
                value={materialSourcing}
                onValueChange={(v) => setValue("materialSourcing", v as "customer" | "we-supply")}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value="customer" 
                    id="material-customer"
                    disabled={includesLaser}
                  />
                  <Label 
                    htmlFor="material-customer" 
                    className={cn(
                      "cursor-pointer",
                      includesLaser && "text-muted-foreground cursor-not-allowed"
                    )}
                  >
                    I will supply the material
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="we-supply" id="material-we-supply" />
                  <Label htmlFor="material-we-supply" className="cursor-pointer">
                    Please supply the material
                  </Label>
                </div>
              </RadioGroup>
              {errors.materialSourcing && (
                <p className="text-destructive text-sm">{errors.materialSourcing.message}</p>
              )}
            </div>

            {/* Laser Safety Note */}
            {includesLaser && (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-md">
                <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">
                  Laser cutting and engraving requires approved materials for safety. For laser work, we supply the material to ensure it is safe for the laser.
                </p>
              </div>
            )}

            {/* Conditional: Material Spec Details (when we supply) */}
            {materialSourcing === "we-supply" && !includesLaser && (
              <div className="space-y-2 pt-2">
                <Label htmlFor="materialSpecDetails">
                  Please let us know any standards or details about the material specs for your project.
                </Label>
                <Textarea
                  id="materialSpecDetails"
                  {...register("materialSpecDetails")}
                  className="input-industrial min-h-[80px]"
                  placeholder="Any specific requirements..."
                />
                <p className="text-xs text-muted-foreground">
                  Examples: grade/spec, finish requirements, corrosion resistance, certs/MTRs, brand preference.
                </p>
              </div>
            )}

            {/* Also show spec details for laser but with slightly different context */}
            {materialSourcing === "we-supply" && includesLaser && (
              <div className="space-y-2 pt-2">
                <Label htmlFor="materialSpecDetails">
                  Please let us know any standards or details about the material specs for your project.
                </Label>
                <Textarea
                  id="materialSpecDetails"
                  {...register("materialSpecDetails")}
                  className="input-industrial min-h-[80px]"
                  placeholder="Any specific requirements..."
                />
                <p className="text-xs text-muted-foreground">
                  Examples: grade/spec, finish requirements, corrosion resistance, certs/MTRs, brand preference.
                </p>
              </div>
            )}

            {/* Conditional: Receiving Guidelines (when customer supplies) */}
            {materialSourcing === "customer" && (
              <Collapsible open={receivingGuidelinesOpen} onOpenChange={setReceivingGuidelinesOpen} className="pt-2">
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center justify-between w-full p-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors text-left"
                  >
                    <span className="font-medium text-sm">
                      Receiving guidelines (we'll confirm after review)
                    </span>
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 text-muted-foreground transition-transform duration-200",
                        receivingGuidelinesOpen && "rotate-180"
                      )}
                    />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2">
                  <div className="p-3 bg-secondary/50 rounded-lg text-sm text-muted-foreground space-y-2">
                    <p>If you're supplying material, include:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Material spec + thickness</li>
                      <li>Sheet/stock dimensions and quantity</li>
                      <li>Estimated delivery date</li>
                      <li>Any certs/MTRs if required</li>
                    </ul>
                    <p className="pt-2">
                      We'll confirm receiving instructions and labeling guidelines with your estimate.
                    </p>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
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
      </CollapsibleContent>
    </Collapsible>
  );
}
