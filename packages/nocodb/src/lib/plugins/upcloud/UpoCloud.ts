import fs from 'fs';
import { promisify } from 'util';
import { S3, S3ClientConfig } from '@aws-sdk/client-s3';
import { IStorageAdapterV2, XcFile } from 'nc-plugin';
import request from 'request';
import {
  generateTempFilePath,
  waitForStreamClose,
} from '../../utils/pluginUtils';

export default class UpoCloud implements IStorageAdapterV2 {
  private s3Client: S3;
  private input: any;

  constructor(input: any) {
    this.input = input;
  }

  async fileCreate(
    key: string,
    file: XcFile,
    _isPublic?: boolean
  ): Promise<any> {
    const uploadParams: any = {
      ACL: 'public-read',
      ContentType: file.mimetype,
      Bucket: this.input.bucket,
    };
    return new Promise((resolve, reject) => {
      // Configure the file stream and obtain the upload parameters
      const fileStream = fs.createReadStream(file.path);
      fileStream.on('error', (err) => {
        console.log('File Error', err);
        reject(err);
      });

      uploadParams.Body = fileStream;
      uploadParams.Key = key;

      // call S3 to retrieve upload file to specified bucket
      this.s3Client.putObject(uploadParams, (err, data) => {
        if (err) {
          console.log('Error', err);
          reject(err);
        }
        if (data) {
          resolve(`${this.input.endpoint}/${uploadParams.Key}`);
        }
      });
    });
  }

  async fileCreateByUrl(key: string, url: string): Promise<any> {
    const uploadParams: any = {
      ACL: 'public-read',
      Bucket: this.input.bucket,
    };
    return new Promise((resolve, reject) => {
      // Configure the file stream and obtain the upload parameters
      request(
        {
          url: url,
          encoding: null,
        },
        (err, httpResponse, body) => {
          if (err) return reject(err);

          uploadParams.Body = body;
          uploadParams.Key = key;
          uploadParams.ContentType = httpResponse.headers['content-type'];

          // call S3 to retrieve upload file to specified bucket
          this.s3Client.putObject(uploadParams, (err1, data) => {
            if (err) {
              console.log('Error', err);
              reject(err1);
            }
            if (data) {
              resolve(`${this.input.endpoint}/${uploadParams.Key}`);
            }
          });
        }
      );
    });
  }

  public async fileDelete(_path: string): Promise<any> {
    return Promise.resolve(undefined);
  }

  public async fileRead(key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.s3Client.getObject({ Key: key } as any, (err, data) => {
        if (err) {
          return reject(err);
        }
        if (!data?.Body) {
          return reject(data);
        }
        return resolve(data.Body);
      });
    });
  }

  public async init(): Promise<any> {
    const s3Options: S3ClientConfig = {
      credentials: {
        accessKeyId: this.input.access_key,
        secretAccessKey: this.input.access_secret,
      },
      region: this.input.region,
      endpoint: this.input.endpoint,
    };

    this.s3Client = new S3(s3Options);
  }

  public async test(): Promise<boolean> {
    try {
      const tempFile = generateTempFilePath();
      const createStream = fs.createWriteStream(tempFile);
      await waitForStreamClose(createStream);
      await this.fileCreate('nc-test-file.txt', {
        path: tempFile,
        mimetype: 'text/plain',
        originalname: 'temp.txt',
        size: '',
      });
      await promisify(fs.unlink)(tempFile);
      return true;
    } catch (e) {
      throw e;
    }
  }
}
