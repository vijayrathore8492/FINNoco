import { IEmailAdapter } from 'nc-plugin';
import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import { SES as AWS_SES, SESClientConfig } from '@aws-sdk/client-ses';
import { XcEmail } from '../../../interface/IEmailAdapter';

export default class SES implements IEmailAdapter {
  private transporter: Mail;
  private input: any;

  constructor(input: any) {
    this.input = input;
  }

  public async init(): Promise<any> {
    const sesOptions: SESClientConfig = {
      credentials: {
        accessKeyId: this.input.access_key,
        secretAccessKey: this.input.access_secret,
      },
      region: this.input.region,
    };

    this.transporter = nodemailer.createTransport({
      SES: new AWS_SES(sesOptions),
    });
  }

  public async mailSend(mail: XcEmail): Promise<any> {
    if (this.transporter) {
      this.transporter.sendMail(
        { ...mail, from: this.input.from },
        (err, info) => {
          if (err) {
            console.log(err);
          } else {
            console.log('Message sent: ' + info.response);
          }
        }
      );
    }
  }

  public async test(): Promise<boolean> {
    try {
      await this.mailSend({
        to: this.input.from,
        subject: 'Test email',
        html: 'Test email',
      } as any);
      return true;
    } catch (e) {
      throw e;
    }
  }
}
