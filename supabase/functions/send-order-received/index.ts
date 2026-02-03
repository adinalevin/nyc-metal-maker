import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface OrderReceivedRequest {
  order_id: string;
  order_code: string;
  customer_email: string;
  customer_name?: string;
  request_type: "Estimate" | "Reorder";
  filenames?: string[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const resendFrom = Deno.env.get("RESEND_FROM");

    if (!resendApiKey || !resendFrom) {
      console.error("Missing RESEND_API_KEY or RESEND_FROM environment variables");
      return new Response(
        JSON.stringify({ ok: false, error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(resendApiKey);
    const body: OrderReceivedRequest = await req.json();

    console.log("Sending order confirmation email for:", body.order_code);

    // Validate required fields
    if (!body.order_id || !body.order_code || !body.customer_email) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const customerName = body.customer_name || "Valued Customer";
    const requestType = body.request_type === "Reorder" ? "Reorder Request" : "Estimate Request";
    const filenames = body.filenames || [];

    // Build file list HTML if files were uploaded
    let filesHtml = "";
    if (filenames.length > 0) {
      filesHtml = `
        <div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 6px;">
          <p style="margin: 0 0 10px 0; font-weight: 600; color: #333;">Files Received:</p>
          <ul style="margin: 0; padding-left: 20px; color: #555;">
            ${filenames.map(f => `<li>${f}</li>`).join("")}
          </ul>
        </div>
      `;
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #1a1a2e; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">NYC Metal Maker</h1>
        </div>
        
        <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1a1a2e; margin-top: 0;">Thank You for Your ${requestType}!</h2>
          
          <p>Hi ${customerName},</p>
          
          <p>We've received your ${requestType.toLowerCase()} and our team is reviewing the details. Here's your confirmation:</p>
          
          <div style="background-color: #f0f4ff; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #666;">Order Reference</p>
            <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #1a1a2e;">${body.order_code}</p>
          </div>
          
          ${filesHtml}
          
          <h3 style="color: #1a1a2e; margin-top: 25px;">What's Next?</h3>
          <ul style="color: #555; padding-left: 20px;">
            <li>Our estimating team will review your files and specifications</li>
            <li>We'll prepare a detailed quote for your project</li>
            <li>Expect to hear from us within 1-2 business days</li>
          </ul>
          
          <p style="margin-top: 25px;">Have questions? Reply to this email or call us directly.</p>
          
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
          
          <p style="color: #888; font-size: 12px; margin: 0;">
            NYC Metal Maker<br>
            Custom Metal Fabrication in NYC
          </p>
        </div>
      </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: resendFrom,
      to: [body.customer_email],
      subject: `${requestType} Received - ${body.order_code}`,
      html: emailHtml,
    });

    if (error) {
      console.error("Resend API error:", error);
      return new Response(
        JSON.stringify({ ok: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Email sent successfully:", data);

    return new Response(
      JSON.stringify({ ok: true, emailId: data?.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error sending order confirmation email:", err);
    return new Response(
      JSON.stringify({ ok: false, error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
