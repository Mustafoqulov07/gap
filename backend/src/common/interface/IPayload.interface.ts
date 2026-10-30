import { Roles } from '../enum';

export interface IPayload {
  sub: number;
  role: Roles;
  deviceId: number;
}
