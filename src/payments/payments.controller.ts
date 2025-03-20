import { Controller, Post, Body, Param, Req, Res } from '@nestjs/common';
import { ApiTags, ApiBody, ApiParam } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { Response, Request } from 'express';
import { VerifyDto } from 'src/dto/verify.dto';

@ApiTags('Payments') // ✅ Swagger API grouping
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // ✅ Initialize Payment
  @Post('initialize/:order_id')
  @ApiParam({ name: 'order_id', required: true, description: 'Order ID for payment' }) // ✅ Swagger documentation
  async initializePayment(@Param('order_id') order_id: string, @Res() res: Response) {
    try {
      const result = await this.paymentsService.initialize_payment(order_id);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Internal Server Error',
      });
    }
  }

  // ✅ Verify Payment
  @Post('verify/:reference')
  @ApiParam({ name: 'reference', required: true, description: 'Payment reference' }) // ✅ Swagger documentation
  @ApiBody({ type: VerifyDto }) // ✅ Ensures `user_id` appears in Swagger
  async verifyPayment(
    @Param('reference') reference: string,
    @Body() dto: VerifyDto, // ✅ Extract user_id properly
    @Res() res: Response,
  ) {
    try {
      const { user_id } = dto; // ✅ Fix: Extract user_id from dto
      const result = await this.paymentsService.verify_payment(reference, user_id);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Internal Server Error',
      });
    }
  }

//   @Post('webhook')
// async handleWebhook(@Req() req: Request, @Res() res: Response) {
//     try {
//         await this.paymentsService.handle_paystack_webhook(req, res);
//     } catch (error) {
//         console.error("🚨 Webhook controller error:", error);
//         return res.status(500).json({
//             success: false,
//             message: error.message || "Webhook processing failed",
//         });
//     }
// }

}
