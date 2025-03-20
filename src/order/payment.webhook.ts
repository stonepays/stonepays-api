import { Controller, Post, Headers, Body, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";

@Controller("webhook")
export class PaystackWebhookController {
    constructor(private configService: ConfigService) {}

    @Post("paystack")
    async handlePaystackWebhook(
        @Headers("x-paystack-signature") signature: string,
        @Body() payload: any
    ) {
        const secret = this.configService.get("PAYSTACK_SECRET_KEY");
        
        // Compute HMAC SHA512 signature
        const computedSignature = crypto
            .createHmac("sha512", secret)
            .update(JSON.stringify(payload))
            .digest("hex");

        // Verify signature
        if (computedSignature !== signature) {
            throw new BadRequestException("Invalid Paystack webhook signature");
        }

        // Handle the event (e.g., update order status)
        if (payload.event === "charge.success") {
            console.log("Payment Successful:", payload.data);
            // Update order status in DB
        }

        return { message: "Webhook received successfully" };
    }
}
