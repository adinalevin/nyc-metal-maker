import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// File validation constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES_PER_ORDER = 10;
const ALLOWED_EXTENSIONS = [".dxf", ".dwg", ".step", ".stp", ".pdf", ".jpg", ".jpeg", ".png"];
const FILENAME_REGEX = /^[a-zA-Z0-9._\-\s()]+$/;

interface UploadRequest {
  orderId: string;
  filename: string;
  fileData: string; // Base64 encoded
  contentType: string;
}

function validateFilename(filename: string): { valid: boolean; error?: string } {
  if (!filename || filename.length > 255) {
    return { valid: false, error: "Invalid filename length" };
  }

  // Check for path traversal
  if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    return { valid: false, error: "Invalid filename characters" };
  }

  // Check filename characters
  if (!FILENAME_REGEX.test(filename)) {
    return { valid: false, error: "Filename contains invalid characters" };
  }

  // Check extension
  const ext = filename.toLowerCase().match(/\.[^.]+$/)?.[0];
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: `Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}` };
  }

  return { valid: true };
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
    const body: UploadRequest = await req.json();
    const { orderId, filename, fileData, contentType } = body;

    console.log("Received file upload request for order:", orderId);

    // Validate order ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!orderId || !uuidRegex.test(orderId)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid order ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify order exists
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.log("Order not found:", orderId);
      return new Response(
        JSON.stringify({ success: false, error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check existing file count for order
    const { count: fileCount } = await supabase
      .from("order_files")
      .select("*", { count: "exact", head: true })
      .eq("order_id", orderId);

    if (fileCount && fileCount >= MAX_FILES_PER_ORDER) {
      return new Response(
        JSON.stringify({ success: false, error: `Maximum ${MAX_FILES_PER_ORDER} files per order` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate filename
    const filenameValidation = validateFilename(filename);
    if (!filenameValidation.valid) {
      return new Response(
        JSON.stringify({ success: false, error: filenameValidation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Decode base64 file data
    if (!fileData) {
      return new Response(
        JSON.stringify({ success: false, error: "File data is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let fileBuffer: Uint8Array;
    try {
      // Remove data URL prefix if present
      const base64Data = fileData.includes(",") ? fileData.split(",")[1] : fileData;
      const binaryString = atob(base64Data);
      fileBuffer = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        fileBuffer[i] = binaryString.charCodeAt(i);
      }
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid file data encoding" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check file size
    if (fileBuffer.length > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({ success: false, error: "File too large (max 10MB)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Upload to storage
    const storagePath = `orders/${orderId}/${filename}`;
    const { error: uploadError } = await supabase.storage
      .from("job-uploads")
      .upload(storagePath, fileBuffer, {
        contentType: contentType || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      console.error("File upload error:", uploadError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to upload file" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create order_files record
    const { error: fileRecordError } = await supabase
      .from("order_files")
      .insert({
        order_id: orderId,
        filename: filename,
        storage_path: storagePath,
      });

    if (fileRecordError) {
      console.error("Order file record error:", fileRecordError);
      // Try to clean up uploaded file
      await supabase.storage.from("job-uploads").remove([storagePath]);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to record file" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("File uploaded successfully:", storagePath);

    return new Response(
      JSON.stringify({ success: true, storagePath }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("File upload error:", err);
    return new Response(
      JSON.stringify({ success: false, error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
