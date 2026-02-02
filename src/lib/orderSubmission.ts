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

export async function submitOrder(
  data: OrderInsertData,
  files: File[]
): Promise<SubmissionResult> {
  try {
    // Insert order into database
    const { data: order, error: orderError } = await (supabase as any)
      .from("orders")
      .insert({
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
      })
      .select("id, order_code")
      .single();

    if (orderError || !order) {
      console.error("Order insert error:", orderError);
      return { success: false, error: orderError?.message || "Failed to create order" };
    }

    const orderId = order.id;
    const orderCode = order.order_code;
    let uploadFailed = false;

    // Upload files to storage and create order_files records
    if (files.length > 0) {
      for (const file of files) {
        const storagePath = `orders/${orderId}/${file.name}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from("job-uploads")
          .upload(storagePath, file);

        if (uploadError) {
          console.error("File upload error:", uploadError);
          uploadFailed = true;
          continue;
        }

        // Insert order_files record
        const { error: fileRecordError } = await (supabase as any)
          .from("order_files")
          .insert({
            order_id: orderId,
            filename: file.name,
            storage_path: storagePath,
          });

        if (fileRecordError) {
          console.error("Order file record error:", fileRecordError);
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
