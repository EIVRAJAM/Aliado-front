import type {
  ContractedService,
  ServiceCatalogs,
  ServiceHistoryEntry,
  ServiceMessage,
  ServiceNotification,
  ServiceTransitionAction,
  ServiceTransitionResponse,
} from '../types/service';

export interface ServiceGateway {
  getDetail(token: string, serviceId: string): Promise<ContractedService>;
  getHistory(token: string, serviceId: string): Promise<ServiceHistoryEntry[]>;
  getMessages(token: string, serviceId: string): Promise<ServiceMessage[]>;
  sendMessage(token: string, serviceId: string, contenido: string): Promise<ServiceMessage>;
  transition(
    token: string,
    serviceId: string,
    action: ServiceTransitionAction
  ): Promise<ServiceTransitionResponse>;
  getCatalogs(token: string): Promise<ServiceCatalogs>;
  listServiceNotifications(token: string): Promise<ServiceNotification[]>;
}
