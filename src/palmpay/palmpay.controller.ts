import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  HttpCode,
  Headers,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { PalmpayService } from './palmpay.service';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';

@ApiTags('Palmpay-Payments')
@Controller('palmpay')
export class PalmpayController {
  constructor(private readonly palmPayService: PalmpayService) {}

  /**
   * Initiates a payment request to PalmPay
   */
  @Post('initiate_payment')
  @ApiOperation({ summary: 'Initiate payment' })
  @ApiBody({
    description: 'Order details for initiating a payment',
    schema: {
      type: 'object',
      properties: {
        order_id: {
          type: 'string',
          description: 'The ID of the order to be paid for',
        },
      },
      required: ['order_id'],
    },
  })
  async initiatePayment(@Body() body: { order_id: string }) {
    const { order_id } = body;

    if (!order_id) {
      throw new BadRequestException('Order ID is required.');
    }

    try {
      console.log('Initiating payment for order ID:', order_id);
      const response = await this.palmPayService.initiate_payment(order_id);
      console.log('Payment initiation response:', response);
      return {
        success: true,
        message: 'Payment initiation successful.',
        data: response,
      };
    } catch (error) {
      console.error('Error in payment initiation:', error.message);
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Payment initiation failed.',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

 /**
 * Handles webhook notifications from PalmPay
 */
// @Post('notify')
// @ApiOperation({ summary: 'Webhook Notification Handler' })
// async handleNotification(@Body() body: any, @Res() res: Response) {
//   try {
//     await this.palmPayService.handle_webhook_notification(body);

//     // Always respond with 200 OK so PalmPay doesn't retry
//     return res.status(HttpStatus.OK).json({ message: 'Received successfully' });
//   } catch (error) {
//     console.error('Webhook Error:', error.message);
//     // Still respond with 200 OK to stop PalmPay retries
//     return res.status(HttpStatus.OK).json({ message: 'Error handled gracefully' });
//   }
// }


@Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() payload: any,
    @Headers('x-signature') signature: string,
  ) {
    // Optional: You can verify signature if PalmPay provides that
    const isValid = await this.palmPayService.verifyWebhookSignature(payload, signature);
    if (!isValid) {
      console.log('Invalid webhook signature.');
      return { status: 'ignored' };
    }

    console.log('Received PalmPay webhook:', payload);

    if (payload.status === 'SUCCESS' && payload.orderNo) {
      await this.palmPayService.handleSuccessfulPayment(payload);
    }

    return { status: 'received' };
  }
}
