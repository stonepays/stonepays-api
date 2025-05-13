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
import jsrsasign from 'jsrsasign';
const { KEYUTIL, KJUR, hextob64, b64utohex } = jsrsasign;

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
        notifyUrl: 'https://stonepays-api-vvad.onrender.com/palmpay/notify',
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



 async handle_webhook_notification(payload: any): Promise<void> {
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

  if (appId !== this.app_id) {
    throw new BadRequestException('Invalid appId');
  }

  // Step 1: Verify Signature
  const dataToSign: Record<string, any> = {
    amount,
    appId,
    completeTime,
    couponAmount,
    orderId,
    orderNo,
    orderStatus,
    orderType,
    payer,
    payerMobileNo,
    status,
    transType,
  };

  const sortedParams = Object.keys(dataToSign)
    .sort()
    .map(key => `${key}=${dataToSign[key]}`)
    .join('&');

  console.log('Sorted Params for Signature:', sortedParams);

  try {
    const publicKey = KEYUTIL.getKey(this.public_key);
    const signatureVerifier = new KJUR.crypto.Signature({ alg: 'SHA256withRSA' });
    signatureVerifier.init(publicKey);
    signatureVerifier.updateString(sortedParams);

    const decodedSign = hextob64(b64utohex(sign));
    const isValid = signatureVerifier.verify(decodedSign);

    console.log('Signature valid:', isValid);

    if (!isValid) {
      throw new BadRequestException('Invalid signature');
    }
  } catch (err) {
    console.error('Signature verification error:', err);
    throw new BadRequestException('Signature verification failed');
  }

  // Step 2: Find Order
  const order = await this.order_model.findOne({ orderNo });
  if (!order) {
    console.error('Order not found:', orderNo);
    throw new BadRequestException('Order not found');
  }

  // Step 3: Update Order if not already paid
  if (order.payment_status !== 'Paid') {
    order.order_status = 'success';
    order.payment_status = 'Paid';
    order.transaction_reference = orderId;
    order.payment_date = new Date(Number(completeTime));
    await order.save();
    console.log('Order updated successfully');
  } else {
    console.log('Order already marked as paid');
  }

  // Step 4: Send Email Notification
  const user = await this.user_model.findById(order.user_details.user_id);
  if (user?.email) {
    try {
      await this.transporter.sendMail({
        from: '"PalmPay Payments" <no-reply@yourapp.com>',
        to: user.email,
        subject: 'Payment Received',
        text: `Dear ${user.first_name || 'User'}, your payment of ₦${(amount / 100).toFixed(2)} was received successfully via PalmPay.`,
      });
      console.log('Payment email sent to:', user.email);
    } catch (emailErr) {
      console.error('Failed to send payment confirmation email:', emailErr);
    }
  }
}



  async handle_webhook(payload: Record<string, any>): Promise<any> {
    const signature = payload.sign;
    if (!signature) {
      throw new BadRequestException('Missing signature');
    }
  
    // Step 1: Sort and concatenate parameters
    const sortedData = Object.keys(payload)
      .sort()
      .filter(key => key !== 'sign' && typeof payload[key] !== 'undefined')
      .map(key => `${key}=${payload[key]}`)
      .join('&');
  
    // Step 2: Format the public key
    const pemPublicKey = this.formatKey(this.public_key);
  
    // Step 3: Verify Signature using jsrsasign
    const sig = new jsrsasign.KJUR.crypto.Signature({ alg: 'SHA256withRSA' });
    sig.init(pemPublicKey);
    sig.updateString(sortedData);
    const isValid = sig.verify(jsrsasign.b64tohex(signature));
  
    if (!isValid) {
      throw new BadRequestException('Invalid signature');
    }
  
    // Step 4: Find the order
    const order = await this.order_model.findOne({ reference: payload.outTradeNo });
    if (!order) {
      throw new BadRequestException('Order not found');
    }
  
    // Step 5: Update the order if success
    if (payload.status === 'SUCCESS') {
      order.payment_status = 'paid';
      order.transaction_reference = payload.tradeNo;
      await order.save();
    }
  
    return { message: 'Webhook processed successfully' };
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
  

  

  // async verify_payment(order_id: string, orderNo: string): Promise<any> {
  //   const url = `${this.api_base_url}/api/v2/payment/merchant/order/queryStatus`;
  
  //   try {
  //     console.log('Received order_id:', order_id);
  
  //     // Validate order ID
  //     if (!/^[a-zA-Z0-9-]+$/.test(order_id)) {
  //       throw new BadRequestException(`Invalid Order ID format: ${order_id}`);
  //     }
  
  //     // Fetch the order from the database
  //     const order = await this.order_model.findOne({ _id: new Types.ObjectId(order_id) }).exec();
  //     if (!order) {
  //       throw new BadRequestException(`Order not found for ID: ${order_id}`);
  //     }
  
  //     const palmpayOrderId = (order as any).palmpayOrderId || order._id.toString();
  
  //     const payload = {
  //       orderId: palmpayOrderId,
  //       orderNo,
  //       nonceStr: crypto.randomBytes(16).toString('hex'),
  //       requestTime: Date.now(),
  //       version: '2.0',
  //     };
  
  //     const constructedString = Object.keys(payload)
  //       .sort()
  //       .map((key) => `${key}=${payload[key]}`)
  //       .join('&');
  
  //     const md5Hash = md5(constructedString).toUpperCase();
  //     const signature = this.generate_signature(md5Hash, this.private_key);
  
  //     const headers = {
  //       Authorization: `Bearer ${this.app_id}`,
  //       'Content-Type': 'application/json',
  //       CountryCode: 'NG',
  //       Signature: signature,
  //     };
  
  //     const response = await this.http_service.axiosRef.post(url, payload, { headers });
  //     console.log('PalmPay API Response:', response.data);
  
  //     if (response.data.respCode !== '00000000' || response.data.data.orderStatus !== 0) {
  //       throw new BadRequestException(response.data.message || 'Payment verification failed');
  //     }

  //     if (order.payment_status !== 'Paid') {
  //       order.payment_status = 'Paid';
  
  //       if (order.order_status === null) {
  //         order.order_status = 'Pending Approval';
  //       }
  
  //       await order.save(); // ✅ Persist changes
  //     }
  
  //     return response.data.data;
  //   } catch (error) {
  //     console.error('Error during payment verification:', error.response?.data || error.message);
  //     throw new BadRequestException(
  //       error.response?.data?.message || 'Payment verification failed',
  //     );
  //   }
  // }
  
  
  

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



