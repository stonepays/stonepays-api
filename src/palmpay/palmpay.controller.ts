import {
    Controller,
    Post,
    Body,
    HttpException,
    HttpStatus,
    BadRequestException,
  } from '@nestjs/common';
  import { PalmpayService } from './palmpay.service';
  import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
  
  @ApiTags('Palmpay-Payments')
  @Controller('palmpay')
  export class PalmpayController {
    constructor(private readonly palmPayService: PalmpayService) {}
  
    /**
     * Initiates a payment request to PalmPay
     * @param body - Contains the order ID
     * @returns Payment initiation response
     */
    @Post('initiate_payment')
    @ApiOperation({ summary: 'Initiate payment' })
    @ApiBody({
      description: 'Order details for initiating a payment',
      schema: {
        type: 'object',
        properties: {
          order_id: { type: 'string', description: 'The ID of the order to be paid for' },
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
     * Verifies a payment request with PalmPay
     * @param body - Contains the order ID and order number
     * @returns Payment verification response
     */
    @Post('verify_payment')
    @ApiOperation({ summary: 'Verify payment' })
    @ApiBody({
      description: 'Order details for verifying a payment',
      schema: {
        type: 'object',
        properties: {
          order_id: { type: 'string', description: 'The ID of the order to verify' },
          orderNo: { type: 'string', description: 'The order number from PalmPay' },
        },
        required: ['order_id', 'orderNo'],
      },
    })
    async verifyPayment(@Body() body: { order_id: string; orderNo: string }) {
      const { order_id, orderNo } = body;
  
      // Validate required fields
      if (!order_id || !orderNo) {
        throw new BadRequestException('Both order_id and orderNo are required.');
      }
  
      try {
        console.log('Verifying payment for order ID:', order_id, 'and order number:', orderNo);
        const result = await this.palmPayService.verify_payment(order_id, orderNo);
        console.log('Payment verification response:', result);
        return {
          success: true,
          message: 'Payment verification successful.',
          data: result,
        };
      } catch (error) {
        console.error('Error in payment verification:', error.message);
        throw new HttpException(
          {
            success: false,
            message: error.message || 'Payment verification failed.',
          },
          error.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }
  