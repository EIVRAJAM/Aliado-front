import type {
  CreateServiceRequestInput,
  LocalPhoto,
  RequestCatalogs,
  ServiceRequest,
  UpdateServiceRequestInput,
  UploadedPhoto,
} from '../types/request';

export interface RequestGateway {
  getCatalogs(token: string): Promise<RequestCatalogs>;
  listMine(token: string): Promise<ServiceRequest[]>;
  getMine(token: string, requestId: string): Promise<ServiceRequest>;
  create(
    token: string,
    input: CreateServiceRequestInput,
    idempotencyKey: string
  ): Promise<ServiceRequest>;
  update(
    token: string,
    requestId: string,
    input: UpdateServiceRequestInput
  ): Promise<ServiceRequest>;
  publish(token: string, requestId: string): Promise<ServiceRequest>;
  cancel(token: string, requestId: string): Promise<void>;
  uploadPhoto(
    token: string,
    requestId: string,
    photo: LocalPhoto,
    onProgress?: (fraction: number) => void
  ): Promise<UploadedPhoto>;
}
