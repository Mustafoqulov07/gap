import type { Request } from 'express';
import DeviceDetector from 'device-detector-js';

export function getDeviceInfo(req: Request) {
  const decorator = new DeviceDetector();
  const userAgent = req.headers['user-agent'] ?? '';
  return decorator.parse(userAgent);
}
