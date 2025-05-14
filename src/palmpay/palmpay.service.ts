import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types} from 'mongoose';
import * as crypto from 'crypto';
import * as md5 from 'md5';
import { Order, OrderDocument } from 'src/schema/order.schema';
import { User, UserDocument } from 'src/schema/user.schema';
import * as nodemailer from 'nodemailer';
const jsrsasign = require('jsrsasign');
const { KEYUTIL, KJUR, hextob64, b64utohex } = jsrsasign;



  const PEM_BEGIN_PUBLIC = '-----BEGIN PUBLIC KEY-----\n';
const PEM_END_PUBLIC = '\n-----END PUBLIC KEY-----';

const HashMap = {
  SHA256withRSA: 'SHA256withRSA',
  SHA1withRSA: 'SHA1withRSA',
};

function sortParams(params: Record<string, any>): string {
  return Object.keys(params)
    .sort()
    .filter(key => key !== 'sign' && typeof params[key] !== 'undefined')
    .map(key => `${key}=${params[key]}`)
    .join('&');
}

function formatKey(key: string): string {
  if (!key.startsWith(PEM_BEGIN_PUBLIC)) {
    key = PEM_BEGIN_PUBLIC + key;
  }
  if (!key.endsWith(PEM_END_PUBLIC)) {
    key += PEM_END_PUBLIC;
  }
  return key;
}


@Injectable()
export class PalmpayService {
  private readonly api_base_url: string;
  private readonly api_key: string;
  private readonly merchant_id: string;
  private readonly app_id: string;
  private readonly call_back_url: string;
  private readonly private_key: string;
  private readonly public_key: string;
  private readonly transporter: nodemailer.Transporter;

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
    this.public_key = this.config_service.get<string>('PALMPAY_PUBLIC_KEY');

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.config_service.get<string>('EMAIL_USER'),
        pass: this.config_service.get<string>('EMAIL_PASS'),
      },
    });
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
        callBackUrl: this.call_back_url,
        currency: 'NGN',
        customerEmail: user.email,
        description: 'Order payment',
        // merchantId: this.merchant_id,
        notifyUrl: 'https://stonepays-api-v2hq.onrender.com/palmpay/payment_callback',
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




async handlePaymentCallback(payload: any, signature: string): Promise<void> {
  const { orderId, orderStatus, status } = payload;

  // Optional: You can verify the sign if PalmPay provided a public key
  const isValid = this.verifyPalmPaySignature(payload);
  if (!isValid) throw new BadRequestException('Invalid signature');

  if (!orderId) throw new BadRequestException('Order ID missing in webhook.');

  const order = await this.order_model.findById(orderId);
  if (!order) throw new BadRequestException('Order not found.');

  // Check if payment was successful
  const isPaid = status === 1 && orderStatus === 2;

  if (isPaid) {
    order.order_status = 'completed'; // or whatever status you use
    order.payment_status = 'paid'; // or whatever status you use
    order.payment_date = payload.completeTime || new Date();
    order.transaction_reference = payload.referenceNo || payload.tradeNo;
    order.payment_reference = payload.referenceNo || payload.tradeNo;
    await order.save();
  } else {
    throw new BadRequestException('Payment not successful.');
  }
}


verifyPalmPaySignature(payload: any): boolean {
  try {
    if (!payload || typeof payload !== 'object') {
      console.error('Invalid payload received for signature verification');
      return false;
    }

    const { sign, signType = 'SHA256withRSA' } = payload;

    if (!sign || typeof sign !== 'string') {
      console.error('Missing or invalid "sign" field in payload');
      return false;
    }

    const sortedString = sortParams(payload);
    const formattedPublicKey = formatKey(this.public_key);

    const publicKey = KEYUTIL.getKey(formattedPublicKey);
    const sig = new KJUR.crypto.Signature({ alg: signType });
    sig.init(publicKey);

    sig.updateString(sortedString);
    const isValid = sig.verify(b64utohex(sign));

    if (!isValid) {
      console.warn('PalmPay signature verification failed');
    }

    return isValid;
  } catch (err) {
    console.error('Error during PalmPay signature verification:', err.message);
    return false;
  }
}


  private formatKey(key: string): string {
    const PEM_BEGIN = '-----BEGIN PUBLIC KEY-----\n';
    const PEM_END = '\n-----END PUBLIC KEY-----';
    if (!key.startsWith(PEM_BEGIN)) {
      key = PEM_BEGIN + key;
    }
    if (!key.endsWith(PEM_END)) {
      key = key + PEM_END;
    }
    return key;
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


  public verify_signature(data: string, receivedSign: string): boolean {
    try {
      const generatedSign = this.generate_signature(data, this.private_key);
      return generatedSign === receivedSign;
    } catch (err) {
      console.error('Error verifying signature:', err.message);
      return false;
    }
  }


}



