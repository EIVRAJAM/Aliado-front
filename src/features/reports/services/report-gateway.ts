import type {
  CreatedReport,
  EvidenceDocument,
  ReportDetail,
  UploadedEvidence,
} from '../types/report';

export interface ReportGateway {
  reportUser(token: string, userId: string, motivo: string): Promise<CreatedReport>;
  reportService(token: string, serviceId: string, motivo: string): Promise<CreatedReport>;
  uploadEvidence(
    token: string,
    reportId: string,
    document: EvidenceDocument
  ): Promise<UploadedEvidence>;
  getMyReport(token: string, reportId: string): Promise<ReportDetail>;
}
