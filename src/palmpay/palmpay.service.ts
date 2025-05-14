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

// function sortParams(params: Record<string, any>): string {
//   return Object.keys(params)
//     .sort()
//     .filter(key => key !== 'sign' && typeof params[key] !== 'undefined')
//     .map(key => `${key}=${params[key]}`)
//     .join('&');
// }

// function formatKey(key: string): string {
//   if (!key.startsWith(PEM_BEGIN_PUBLIC)) {
//     key = PEM_BEGIN_PUBLIC + key;
//   }
//   if (!key.endsWith(PEM_END_PUBLIC)) {
//     key += PEM_END_PUBLIC;
//   }
//   return key;
// }


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


  verifyWebhookSignature(payload: Record<string, any>, publicKey: string): boolean {
    try {
      const receivedSign = decodeURIComponent(payload.sign);
      const sortedParams = this.sortParams(payload);
      const formattedKey = this.formatKey(publicKey);

      const sig = new KJUR.crypto.Signature({ alg: HashMap.SHA256withRSA });
      sig.init(formattedKey);
      sig.updateString(sortedParams);

      const isValid = sig.verify(b64utohex(receivedSign));
      console.log('Signature valid:', isValid);

      return isValid;
    } catch (err) {
      console.error('Webhook Signature Verification Error:', err);
      return false;
    }
  }

  async handleWebhook(payload: any): Promise<void> {
  const {
    appId,
    orderId,
    orderNo,
    transType,
    orderType,
    amount,
    couponAmount,
    status,
    completeTime,
    payerMobileNo,
    orderStatus,
    payer,
    sign,
  } = payload;

  console.log('Received webhook payload:', payload);

  // Step 1: Verify appId
  if (appId !== this.app_id) {
    throw new BadRequestException('Invalid appId');
  }

  // // Step 2: Construct data to verify (treat `payer` as JSON string)
  // const dataToSign: Record<string, any> = {
  //   amount,
  //   appId,
  //   completeTime,
  //   couponAmount,
  //   orderId,
  //   orderNo,
  //   orderStatus,
  //   orderType,
  //   payer, // Must be string during verification
  //   payerMobileNo,
  //   status,
  //   transType,
  // };

  // // Step 3: Verify Signature
  // try {
  //   const sortedParams = this.sortParams(dataToSign);
  //   console.log('Sorted Params for Signature:', sortedParams);

  //   const decodedSign = decodeURIComponent(sign);
  //   const formattedPublicKey = this.formatKey(this.public_key);
  //   const publicKey = KEYUTIL.getKey(formattedPublicKey);

  //   const sig = new KJUR.crypto.Signature({ alg: HashMap.SHA256withRSA });
  //   sig.init(publicKey);
  //   sig.updateString(sortedParams);

  //   const isValid = sig.verify(b64utohex(decodedSign));
  //   console.log('Signature valid:', isValid);

  //   if (!isValid) {
  //     throw new BadRequestException('Invalid signature');
  //   }
  // } catch (err) {
  //   console.error('Signature verification error:', err);
  //   throw new BadRequestException('Signature verification failed');
  // }

  // // Step 4: Parse `payer` string to JSON for further use
  // let parsedPayer: Record<string, any> = {};
  // try {
  //   parsedPayer = JSON.parse(payer);
  //   console.log('Parsed payer:', parsedPayer);
  // } catch (parseError) {
  //   console.error('Failed to parse payer field:', parseError);
  //   throw new BadRequestException('Invalid payer format');
  // }

  // // Step 5: Continue with business logic using `parsedPayer`
  // // Example: Find and update the order, log payment, notify user, etc.
  // console.log('Payer Info:', parsedPayer);
  // console.log('Order ID:', orderId);
  
  // Step 2: Continue with business logic after successful signature verification
  const order = await this.order_model.findById(orderId).exec();
  if (!order) {
    throw new BadRequestException('Order not found');
  }

  // Step 3: Handle order update based on webhook status
  if (status === 1 && orderStatus === 2) {
    order.order_status = 'completed'; 
    order.payment_status = 'paid'; 
    order.total_price = amount;
    order.payment_date = completeTime;
    order.transaction_reference = orderNo;
    order.payment_reference = orderNo;
    await order.save();

    // Optional: Send notification or trigger further actions, such as user wallet update
    console.log('Order successfully updated.');
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


  // public verify_signature(data: string, receivedSign: string): boolean {
  //   try {
  //     const generatedSign = this.generate_signature(data, this.private_key);
  //     return generatedSign === receivedSign;
  //   } catch (err) {
  //     console.error('Error verifying signature:', err.message);
  //     return false;
  //   }
  // }

  public sortParams(params: Record<string, any>): string {
  return Object.keys(params)
    .sort()
    .filter(key => key !== 'sign' && typeof params[key] !== 'undefined')
    .map(key => {
      const value =
        key === 'payer' && typeof params[key] === 'object'
          ? JSON.stringify(params[key])
          : params[key];
      return `${key}=${value}`;
    })
    .join('&');
}



}



