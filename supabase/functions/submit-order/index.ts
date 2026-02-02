import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Rate limit: 5 submissions per email per hour
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// Validation constants
const MAX_EMAIL_LENGTH = 255;
const MAX_NAME_LENGTH = 100;
const MAX_PHONE_LENGTH = 20;
const MAX_NOTES_LENGTH = 5000;
const MAX_MATERIAL_SPEC_LENGTH = 2000;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+\s().-]*$/;

interface OrderData {
  request_type: "Estimate" | "Reorder";
  status: string;
  customer_email: string;
  customer_name?: string;
  company?: string;
  customer_phone?: string;
  offering?: string;
  material?: string;
  thickness?: string;
  custom_thickness?: string;
  quantity?: string;
  finish?: string;
  material_sourcing?: string;
  material_spec_details?: string;
  addons?: string[];
  callback_requested?: boolean;
  preferred_method?: string;
  best_time?: string;
  part_id?: string;
  revision?: string;
  needed_by?: string;
  delivery_method?: string;
  delivery_zip?: string;
  file_link?: string;
  notes?: string;
}

interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitized?: OrderData;
}

function validateAndSanitize(data: unknown): ValidationResult {
  if (!data || typeof data !== "object") {
    return { valid: false, error: "Invalid request body" };
  }

  const input = data as Record<string, unknown>;

  // Required fields
  if (!input.customer_email || typeof input.customer_email !== "string") {
    return { valid: false, error: "Email is required" };
  }

  const email = input.customer_email.trim().toLowerCase();
  if (email.length > MAX_EMAIL_LENGTH) {
    return { valid: false, error: "Email too long" };
  }
  if (!EMAIL_REGEX.test(email)) {
    return { valid: false, error: "Invalid email format" };
  }

  if (!input.request_type || !["Estimate", "Reorder"].includes(input.request_type as string)) {
    return { valid: false, error: "Invalid request type" };
  }

  // Optional field validation
  const customerName = input.customer_name as string | undefined;
  if (customerName && customerName.length > MAX_NAME_LENGTH) {
    return { valid: false, error: "Name too long (max 100 characters)" };
  }

  const phone = input.customer_phone as string | undefined;
  if (phone) {
    if (phone.length > MAX_PHONE_LENGTH) {
      return { valid: false, error: "Phone too long (max 20 characters)" };
    }
    if (!PHONE_REGEX.test(phone)) {
      return { valid: false, error: "Invalid phone format" };
    }
  }

  const notes = input.notes as string | undefined;
  if (notes && notes.length > MAX_NOTES_LENGTH) {
    return { valid: false, error: "Notes too long (max 5000 characters)" };
  }

  const materialSpec = input.material_spec_details as string | undefined;
  if (materialSpec && materialSpec.length > MAX_MATERIAL_SPEC_LENGTH) {
    return { valid: false, error: "Material spec too long (max 2000 characters)" };
  }

  // Sanitize and build validated data
  const sanitized: OrderData = {
    request_type: input.request_type as "Estimate" | "Reorder",
    status: typeof input.status === "string" ? input.status.slice(0, 50) : "In Estimating",
    customer_email: email,
    customer_name: customerName?.slice(0, MAX_NAME_LENGTH),
    company: typeof input.company === "string" ? input.company.slice(0, 100) : undefined,
    customer_phone: phone?.slice(0, MAX_PHONE_LENGTH),
    offering: typeof input.offering === "string" ? input.offering.slice(0, 100) : undefined,
    material: typeof input.material === "string" ? input.material.slice(0, 100) : undefined,
    thickness: typeof input.thickness === "string" ? input.thickness.slice(0, 50) : undefined,
    custom_thickness: typeof input.custom_thickness === "string" ? input.custom_thickness.slice(0, 50) : undefined,
    quantity: typeof input.quantity === "string" ? input.quantity.slice(0, 50) : undefined,
    finish: typeof input.finish === "string" ? input.finish.slice(0, 50) : undefined,
    material_sourcing: typeof input.material_sourcing === "string" ? input.material_sourcing.slice(0, 50) : undefined,
    material_spec_details: materialSpec?.slice(0, MAX_MATERIAL_SPEC_LENGTH),
    addons: Array.isArray(input.addons) ? input.addons.filter((a): a is string => typeof a === "string").slice(0, 20) : undefined,
    callback_requested: typeof input.callback_requested === "boolean" ? input.callback_requested : false,
    preferred_method: typeof input.preferred_method === "string" ? input.preferred_method.slice(0, 20) : undefined,
    best_time: typeof input.best_time === "string" ? input.best_time.slice(0, 20) : undefined,
    part_id: typeof input.part_id === "string" ? input.part_id.slice(0, 100) : undefined,
    revision: typeof input.revision === "string" ? input.revision.slice(0, 50) : undefined,
    needed_by: typeof input.needed_by === "string" ? input.needed_by.slice(0, 20) : undefined,
    delivery_method: typeof input.delivery_method === "string" ? input.delivery_method.slice(0, 20) : undefined,
    delivery_zip: typeof input.delivery_zip === "string" ? input.delivery_zip.slice(0, 10) : undefined,
    file_link: typeof input.file_link === "string" && input.file_link.length <= 2000 ? input.file_link : undefined,
    notes: notes?.slice(0, MAX_NOTES_LENGTH),
  };

  return { valid: true, sanitized };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create admin client with service role
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Parse request body
    const body = await req.json();
    console.log("Received order submission request");

    // Validate and sanitize input
    const validation = validateAndSanitize(body);
    if (!validation.valid || !validation.sanitized) {
      console.log("Validation failed:", validation.error);
      return new Response(
        JSON.stringify({ success: false, error: validation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const orderData = validation.sanitized;
    const email = orderData.customer_email;

    // Rate limiting check
    const now = new Date();
    const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW_MS);

    // Check existing rate limit record
    const { data: existingLimit } = await supabase
      .from("order_rate_limits")
      .select("*")
      .eq("identifier", email)
      .single();

    if (existingLimit) {
      const limitWindowStart = new Date(existingLimit.window_start);
      
      if (limitWindowStart > windowStart) {
        // Within rate limit window
        if (existingLimit.submission_count >= RATE_LIMIT_MAX) {
          console.log("Rate limit exceeded for:", email);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: "Too many submissions. Please try again later." 
            }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // Increment count
        await supabase
          .from("order_rate_limits")
          .update({ submission_count: existingLimit.submission_count + 1 })
          .eq("identifier", email);
      } else {
        // Window expired, reset
        await supabase
          .from("order_rate_limits")
          .update({ submission_count: 1, window_start: now.toISOString() })
          .eq("identifier", email);
      }
    } else {
      // Create new rate limit record
      await supabase
        .from("order_rate_limits")
        .insert({ identifier: email, submission_count: 1, window_start: now.toISOString() });
    }

    // Insert order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        request_type: orderData.request_type,
        status: orderData.status,
        customer_email: orderData.customer_email,
        customer_name: orderData.customer_name || null,
        company: orderData.company || null,
        customer_phone: orderData.customer_phone || null,
        offering: orderData.offering || null,
        material: orderData.material || null,
        thickness: orderData.thickness || null,
        custom_thickness: orderData.custom_thickness || null,
        quantity: orderData.quantity || null,
        finish: orderData.finish || null,
        material_sourcing: orderData.material_sourcing || null,
        material_spec_details: orderData.material_spec_details || null,
        addons: orderData.addons && orderData.addons.length > 0 ? orderData.addons : null,
        callback_requested: orderData.callback_requested || false,
        preferred_method: orderData.preferred_method || null,
        best_time: orderData.best_time || null,
        part_id: orderData.part_id || null,
        revision: orderData.revision || null,
        needed_by: orderData.needed_by || null,
        delivery_method: orderData.delivery_method || null,
        delivery_zip: orderData.delivery_zip || null,
        file_link: orderData.file_link || null,
        notes: orderData.notes || null,
      })
      .select("id, order_code")
      .single();

    if (orderError || !order) {
      console.error("Order insert error:", orderError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to create order",
          details: orderError ?? null
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Order created successfully:", order.order_code);

    return new Response(
      JSON.stringify({
        success: true,
        orderId: order.id,
        orderCode: order.order_code,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Order submission error:", err);
    return new Response(
      JSON.stringify({ success: false, error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
