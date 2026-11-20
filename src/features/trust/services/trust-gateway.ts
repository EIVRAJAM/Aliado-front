import type {
  ClientRatingHistoryPage,
  RatingResult,
  ReportReviewResult,
  ReviewResult,
  VerificationDocument,
  VerificationRequest,
} from '../types/trust';

export interface TrustGateway {
  calificar(token: string, servicioId: string, valor: number): Promise<RatingResult>;
  agregarResena(token: string, calificacionId: string, texto: string): Promise<ReviewResult>;
  getMiVerificacion(token: string): Promise<VerificationRequest>;
  solicitarVerificacion(
    token: string,
    documentos: VerificationDocument[]
  ): Promise<VerificationRequest>;
  reportarResena(token: string, resenaId: string, motivo: string): Promise<ReportReviewResult>;
  getMyRatings(
    token: string,
    pagina: number,
    tamano: number
  ): Promise<ClientRatingHistoryPage>;
}
