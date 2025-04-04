import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types} from 'mongoose';
import * as crypto from 'crypto';
import * as md5 from 'md5';
import { Order, OrderDocument } from 'src/schema/order.schema';
import { User, UserDocument } from 'src/schema/user.schema';

@Injectable()
export class PalmpayService {
  private readonly api_base_url: string;
  private readonly api_key: string;
  private readonly merchant_id: string;
  private readonly app_id: string;
  private readonly call_back_url: string;
  private readonly private_key: string;

  constructor(
    private readonly config_service: ConfigService,
    private readonly http_service: HttpService,
    @InjectModel(Order.name) private readonly order_model: Model<OrderDocument>,
    @InjectModel(User.name) private readonly user_model: Model<UserDocument>,
  ) {
    this.api_base_url = this.config_service.get<string>('PALMPAY_BASE_URL');
    this.api_key = this.config_service.get<string>('PALMPAY_API_KEY');
    this.merchant_id = this.config_service.get<string>('PALMPAY_MERCHANT_ID');
    this.app_id = this.config_service.get<string>('PALMPAY_APP_ID');
    this.call_back_url = this.config_service.get<string>('PALMPAY_REDIRECT_URL');
    this.private_key = this.config_service.get<string>('PALMPAY_PRIVATE_KEY');
  }

  async initiate_payment(order_id: string): Promise<any> {
    const url = `${this.api_base_url}/api/v2/payment/merchant/createorder`;

    try {
      console.log('Initiating payment for order ID:', order_id);

      const order = await this.order_model.findById(order_id).exec();
      if (!order) throw new BadRequestException('Order not found');
      if (order.payment_status === 'Paid') throw new BadRequestException('Order has already been paid');

      const user = await this.user_model.findById(order.user_details.user_id).exec();
      if (!user) throw new BadRequestException('User not found');

      const nonceStr = crypto.randomBytes(16).toString('hex');
      const requestTime = Date.now();

      const payload = {
        amount: order.total_price,
        callbackUrl: this.call_back_url,
        currency: 'NGN',
        customerEmail: user.email,
        description: 'Order payment',
        merchantId: this.merchant_id,
        nonceStr,
        orderId: order._id,
        requestTime,
        version: '2.0',
      };

      const constructedString = Object.keys(payload)
        .sort()
        .map((key) => `${key}=${payload[key]}`)
        .join('&');

      console.log('Constructed String:', constructedString);

      const md5Hash = md5(constructedString).toUpperCase();
      console.log('MD5 Hash:', md5Hash);

      const signature = this.generate_signature(md5Hash, this.private_key);
      console.log('Generated Signature:', signature);

      const headers = {
        Authorization: `Bearer ${this.app_id}`,
        'Content-Type': 'application/json',
        CountryCode: 'NG',
        Signature: signature,
      };

      const response = await this.http_service.axiosRef.post(url, payload, { headers });
      console.log('PalmPay API response:', response.data);
      

      return response.data;
    } catch (error) {
      console.error('Error during payment initiation:', error.response?.data || error.message);
      throw new BadRequestException(error.response?.data?.message || 'Payment initiation failed');
    }
  }

  

  async verify_payment(order_id: string, orderNo: string): Promise<any> {
    const url = `${this.api_base_url}/api/v2/payment/merchant/order/queryStatus`;
  
    try {
      console.log('Received order_id:', order_id);
  
      // Validate order ID
      if (!/^[a-zA-Z0-9-]+$/.test(order_id)) {
        throw new BadRequestException(`Invalid Order ID format: ${order_id}`);
      }
  
      // Fetch the order from the database
      const order = await this.order_model.findOne({ _id: new Types.ObjectId(order_id) }).exec();
      if (!order) {
        throw new BadRequestException(`Order not found for ID: ${order_id}`);
      }
  
      const palmpayOrderId = (order as any).palmpayOrderId || order._id.toString();
  
      const payload = {
        orderId: palmpayOrderId,
        orderNo,
        nonceStr: crypto.randomBytes(16).toString('hex'),
        requestTime: Date.now(),
        version: '2.0',
      };
  
      const constructedString = Object.keys(payload)
        .sort()
        .map((key) => `${key}=${payload[key]}`)
        .join('&');
  
      const md5Hash = md5(constructedString).toUpperCase();
      const signature = this.generate_signature(md5Hash, this.private_key);
  
      const headers = {
        Authorization: `Bearer ${this.app_id}`,
        'Content-Type': 'application/json',
        CountryCode: 'NG',
        Signature: signature,
      };
  
      const response = await this.http_service.axiosRef.post(url, payload, { headers });
      console.log('PalmPay API Response:', response.data);
  
      if (response.data.respCode !== '00000000' || response.data.data.orderStatus !== 0) {
        throw new BadRequestException(response.data.message || 'Payment verification failed');
      }

      if (order.payment_status !== 'Paid') {
        order.payment_status = 'Paid';
  
        if (order.order_status === null) {
          order.order_status = 'Pending Approval';
        }
  
        await order.save(); // ✅ Persist changes
      }
  
      return response.data.data;
    } catch (error) {
      console.error('Error during payment verification:', error.response?.data || error.message);
      throw new BadRequestException(
        error.response?.data?.message || 'Payment verification failed',
      );
    }
  }
  
  
  

  private generate_signature(data: string, privateKey: string): string {
    try {
      const formattedPrivateKey = privateKey.startsWith('-----BEGIN')
        ? privateKey
        : `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;

      console.log('Formatted Private Key:', formattedPrivateKey);

      const signer = crypto.createSign('RSA-SHA1');
      signer.update(data, 'utf8');
      signer.end();

      return signer.sign(formattedPrivateKey, 'base64');
    } catch (err) {
      console.error('Error during signature generation:', err.message);
      throw new BadRequestException('Failed to generate signature');
    }
  }
}
