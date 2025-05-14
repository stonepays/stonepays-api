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
import { sign } from 'crypto';

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



  @Post('payment_callback')
  @HttpCode(200)
  async handlePalmPayCallback(@Body() payload: any, signature: string, @Res() res: Response) {
    try {
      await this.palmPayService.handlePaymentCallback(payload, signature);
      return res.send('success'); // PalmPay expects this exact string
    } catch (error) {
      console.error('PalmPay webhook error:', error.message);
      return res.status(400).send('failure'); // You can customize this as needed
    }
  }

  
}
