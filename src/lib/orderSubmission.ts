import { supabase } from "@/integrations/supabase/client";

interface OrderInsertData {
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

interface SubmissionResult {
  success: boolean;
  orderId?: string;
  orderCode?: string;
  uploadFailed?: boolean;
  error?: string;
}

// Convert file to base64 for edge function upload
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

export async function submitOrder(
  data: OrderInsertData,
  files: File[]
): Promise<SubmissionResult> {
  try {
    // Call edge function for order creation (with rate limiting and server-side validation)
    const { data: orderResult, error: orderError } = await supabase.functions.invoke(
      "submit-order",
      {
        body: {
          request_type: data.request_type,
          status: data.status,
          customer_email: data.customer_email,
          customer_name: data.customer_name || null,
          company: data.company || null,
          customer_phone: data.customer_phone || null,
          offering: data.offering || null,
          material: data.material || null,
          thickness: data.thickness || null,
          custom_thickness: data.custom_thickness || null,
          quantity: data.quantity || null,
          finish: data.finish || null,
          material_sourcing: data.material_sourcing || null,
          material_spec_details: data.material_spec_details || null,
          addons: data.addons && data.addons.length > 0 ? data.addons : null,
          callback_requested: data.callback_requested || false,
          preferred_method: data.preferred_method || null,
          best_time: data.best_time || null,
          part_id: data.part_id || null,
          revision: data.revision || null,
          needed_by: data.needed_by || null,
          delivery_method: data.delivery_method || null,
          delivery_zip: data.delivery_zip || null,
          file_link: data.file_link || null,
          notes: data.notes || null,
        },
      }
    );

    if (orderError) {
      console.error("Order submission error:", orderError);
      return { success: false, error: orderError.message || "Failed to create order" };
    }

    if (!orderResult?.success || !orderResult?.orderId) {
      console.error("Order creation failed:", orderResult?.error);
      return { success: false, error: orderResult?.error || "Failed to create order" };
    }

    const orderId = orderResult.orderId;
    const orderCode = orderResult.orderCode;
    let uploadFailed = false;

    // Upload files via edge function
    if (files.length > 0) {
      for (const file of files) {
        try {
          const fileData = await fileToBase64(file);
          
          const { data: uploadResult, error: uploadError } = await supabase.functions.invoke(
            "upload-order-file",
            {
              body: {
                orderId,
                filename: file.name,
                fileData,
                contentType: file.type,
              },
            }
          );

          if (uploadError || !uploadResult?.success) {
            console.error("File upload error:", uploadError || uploadResult?.error);
            uploadFailed = true;
          }
        } catch (err) {
          console.error("File processing error:", err);
          uploadFailed = true;
        }
      }
    }

    return {
      success: true,
      orderId,
      orderCode,
      uploadFailed,
    };
  } catch (err) {
    console.error("Order submission error:", err);
    return { success: false, error: "An unexpected error occurred" };
  }
}
