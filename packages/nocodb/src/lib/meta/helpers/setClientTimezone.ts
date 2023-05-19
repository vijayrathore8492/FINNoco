import { Request } from 'express';

export default (req: Request, _res, next) => {
  req['clientTimeZone'] =
    req.header('xc-timezone') ||
    Intl.DateTimeFormat().resolvedOptions().timeZone;

  next();
};
