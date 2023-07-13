import fs from 'fs';
import { promisify } from 'util';
import { GetObjectCommand, S3 as S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import slash from 'slash';
import { IStorageAdapterV2, XcFile } from 'nc-plugin';
import request from 'request';
import {
  generateTempFilePath,
  waitForStreamClose,
} from '../../utils/pluginUtils';
import path from 'path';

export default class S3 implements IStorageAdapterV2 {
  private s3Client: S3Client;
  private input: any;

  constructor(input: any) {
    this.input = input;
  }

  public async init(): Promise<any> {
    const s3Options = {
      region: this.input.region,
      credentials: {
        accessKeyId: this.input.access_key,
        secretAccessKey: this.input.access_secret,
      },
    };

    this.s3Client = new S3Client(s3Options);
  }

  get defaultUploadParams() {
    return {
      ACL: 'private',
      Bucket: this.input.bucket,
    };
  }

  async fileCreate(key: string, file: XcFile, isPublic = false): Promise<any> {
    const uploadParams: any = {
      ACL: isPublic ? 'public-read' : 'private',
      ContentType: file.mimetype,
    };
    // Configure the file stream and obtain the upload parameters
    const fileStream = fs.createReadStream(file.path);
    fileStream.on('error', (err) => {
      console.log('File Error', err);
      throw err;
    });

    uploadParams.Body = fileStream;
    uploadParams.Key = key;

    const result = await this.upload(uploadParams);

    // unlink file after upload if file exists
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    return result;
  }

  public async getSignedUrl(key, expires = 900) {
    const command = new GetObjectCommand({
      Key: key,
      Bucket: this.input.bucket,
    });
    return getSignedUrl(this.s3Client, command, { expiresIn: expires });
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

  public async fileCreateByUrl(key: string, url: string): Promise<any> {
    const uploadParams: any = {
      ACL: 'public-read',
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

          return resolve(this.upload(uploadParams));
        }
      );
    });
  }

  /**
   * Writes the given data to the given file.
   * @param {string} location - the file location
   * @param {string} fileName - file name
   * @param {string} data - Data to write
   * @returns None
   */
  public async fileWrite({
    location,
    fileName,
    content,
    contentType,
  }): Promise<any> {
    const buf = Buffer.from(content);
    return await this.upload({
      Key: slash(path.join(location, fileName)),
      Body: buf,
      ContentEncoding: 'base64',
      ContentType: contentType,
    });
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

      if (fs.existsSync(tempFile)) {
        await promisify(fs.unlink)(tempFile);
      }

      return true;
    } catch (e) {
      throw e;
    }
  }

  private async upload(uploadParams): Promise<any> {
    return new Promise((resolve, reject) => {
      // call S3 to retrieve upload file to specified bucket
      this.s3Client
        .putObject({ ...this.defaultUploadParams, ...uploadParams })
        .then((data) => {
          if (data) {
            resolve(
              `https://${this.input.bucket}.s3.${this.input.region}.amazonaws.com/${uploadParams.Key}`
            );
          }
        })
        .catch((err) => {
          console.error(err);
          reject(err);
        });
    });
  }
}
