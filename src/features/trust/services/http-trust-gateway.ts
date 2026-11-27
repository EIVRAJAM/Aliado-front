import { ApiError, requestJson } from '../../../shared/api/http-client';
import {
  TrustError,
  type ClientRating,
  type ClientRatingHistoryPage,
  type RatingHistoryProvider,
  type RatingHistoryReview,
  type RatingHistoryService,
  type RatingResult,
  type ReportReviewResult,
  type ReviewResult,
  type VerificationDocument,
  type VerificationRequest,
  type VerificationStatus,
} from '../types/trust';
import type { TrustGateway } from './trust-gateway';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function requiredString(value: unknown): string {
  if (typeof value !== 'string' || !value) {
    throw new TrustError(
      'INVALID_RESPONSE',
      'No pudimos interpretar la respuesta de ALIADO. Intenta de nuevo.'
    );
  }
  return value;
}

function requiredNumber(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TrustError(
      'INVALID_RESPONSE',
      'No pudimos interpretar la respuesta de ALIADO. Intenta de nuevo.'
    );
  }
  return value;
}

function isVerificationStatus(value: unknown): value is VerificationStatus {
  return value === 'PENDIENTE' || value === 'APROBADA' || value === 'RECHAZADA';
}

function parseRating(value: unknown): RatingResult {
  if (!isRecord(value)) {
    throw new TrustError(
      'INVALID_RESPONSE',
      'No pudimos interpretar la respuesta de ALIADO. Intenta de nuevo.'
    );
  }
  return {
    id: requiredString(value.id),
    reputacionActualizada: requiredNumber(value.reputacionActualizada),
  };
}

function parseReviewResult(value: unknown): ReviewResult {
  if (!isRecord(value)) {
    throw new TrustError(
      'INVALID_RESPONSE',
      'No pudimos interpretar la respuesta de ALIADO. Intenta de nuevo.'
    );
  }
  return { id: requiredString(value.id) };
}

function parseVerification(value: unknown): VerificationRequest {
  if (!isRecord(value) || !isVerificationStatus(value.estado)) {
    throw new TrustError(
      'INVALID_RESPONSE',
      'No pudimos interpretar la respuesta de ALIADO. Intenta de nuevo.'
    );
  }
  return { id: requiredString(value.id), estado: value.estado };
}

function parseReport(value: unknown): ReportReviewResult {
  if (!isRecord(value)) {
    throw new TrustError(
      'INVALID_RESPONSE',
      'No pudimos interpretar la respuesta de ALIADO. Intenta de nuevo.'
    );
  }
  return { reporteId: requiredString(value.reporteId) };
}


function nullableString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== 'string') {
    throw new TrustError(
      'INVALID_RESPONSE',
      'No pudimos interpretar la respuesta de ALIADO. Intenta de nuevo.'
    );
  }
  return value;
}

function optionalString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function requiredInteger(value: unknown): number {
  const number = requiredNumber(value);
  if (!Number.isInteger(number) || number < 0) {
    throw new TrustError(
      'INVALID_RESPONSE',
      'No pudimos interpretar la respuesta de ALIADO. Intenta de nuevo.'
    );
  }
  return number;
}

function parseRatingHistoryReview(value: unknown): RatingHistoryReview | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (!isRecord(value)) {
    throw new TrustError(
      'INVALID_RESPONSE',
      'No pudimos interpretar la respuesta de ALIADO. Intenta de nuevo.'
    );
  }
  return {
    id: requiredString(value.id),
    texto: requiredString(value.texto),
    fechaCreacion: requiredString(value.fechaCreacion),
  };
}

function parseRatingHistoryService(value: unknown): RatingHistoryService | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (!isRecord(value)) {
    throw new TrustError(
      'INVALID_RESPONSE',
      'No pudimos interpretar la respuesta de ALIADO. Intenta de nuevo.'
    );
  }
  return {
    descripcion: nullableString(value.descripcion),
    categoria: nullableString(value.categoria),
    zonaAproximada: nullableString(value.zonaAproximada),
  };
}

function parseRatingHistoryProvider(value: unknown): RatingHistoryProvider | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (!isRecord(value)) {
    throw new TrustError(
      'INVALID_RESPONSE',
      'No pudimos interpretar la respuesta de ALIADO. Intenta de nuevo.'
    );
  }
  return {
    id: nullableString(value.id),
    nombrePublico: optionalString(value.nombrePublico),
  };
}

function parseClientRating(value: unknown): ClientRating {
  if (!isRecord(value)) {
    throw new TrustError(
      'INVALID_RESPONSE',
      'No pudimos interpretar la respuesta de ALIADO. Intenta de nuevo.'
    );
  }
  const valor = requiredNumber(value.valor);
  if (valor < 1 || valor > 5) {
    throw new TrustError(
      'INVALID_RESPONSE',
      'No pudimos interpretar la respuesta de ALIADO. Intenta de nuevo.'
    );
  }
  return {
    calificacionId: requiredString(value.calificacionId),
    servicioId: requiredString(value.servicioId),
    valor,
    fechaCalificacion: requiredString(value.fechaCalificacion),
    resena: parseRatingHistoryReview(value.resena),
    servicio: parseRatingHistoryService(value.servicio),
    prestador: parseRatingHistoryProvider(value.prestador),
  };
}

function parseClientRatingHistoryPage(value: unknown): ClientRatingHistoryPage {
  if (!isRecord(value) || !Array.isArray(value.items)) {
    throw new TrustError(
      'INVALID_RESPONSE',
      'No pudimos interpretar la respuesta de ALIADO. Intenta de nuevo.'
    );
  }
  const items = value.items.map(parseClientRating).sort((left, right) => {
    const leftTime = Date.parse(left.fechaCalificacion);
    const rightTime = Date.parse(right.fechaCalificacion);
    const safeLeft = Number.isNaN(leftTime) ? 0 : leftTime;
    const safeRight = Number.isNaN(rightTime) ? 0 : rightTime;
    return safeRight - safeLeft;
  });
  return {
    items,
    pagina: requiredInteger(value.pagina),
    tamano: requiredInteger(value.tamano),
    totalElementos: requiredInteger(value.totalElementos),
    totalPaginas: requiredInteger(value.totalPaginas),
  };
}

function getServerCode(body: unknown): string | undefined {
  return isRecord(body) && typeof body.code === 'string' ? body.code : undefined;
}

function getServerMessage(body: unknown): string | undefined {
  return isRecord(body) && typeof body.message === 'string' && body.message.trim()
    ? body.message
    : undefined;
}

function getServerPath(body: unknown): string | undefined {
  return isRecord(body) && typeof body.path === 'string' ? body.path : undefined;
}

function conflictMessage(serverCode?: string): string {
  switch (serverCode) {
    case 'YA_CALIFICADO':
      return 'Este servicio ya tiene una calificación registrada. No es posible consultarla ni editarla desde la app.';
    case 'SERVICIO_NO_FINALIZADO':
      return 'El servicio dejó de estar finalizado o ya no cumple las condiciones para calificarse.';
    case 'RESENA_YA_EXISTE':
      return 'Esta calificación ya tiene una reseña registrada.';
    case 'VERIFICACION_PENDIENTE':
      return 'Ya tienes una solicitud de verificación en revisión.';
    case 'NIVEL_MAXIMO_ALCANZADO':
      return 'Ya alcanzaste el nivel máximo de verificación disponible.';
    case 'RESENA_OCULTA':
      return 'La reseña ya no está disponible para reportes.';
    default:
      return 'La operación no se puede completar en el estado actual.';
  }
}

function mapApiError(error: unknown, fallback: string): TrustError {
  if (error instanceof TrustError) {
    return error;
  }
  if (error instanceof ApiError) {
    const serverCode = getServerCode(error.body);
    const serverMessage = getServerMessage(error.body);

    if (error.status === 401) {
      return new TrustError(
        'SESSION_EXPIRED',
        'Tu sesión expiró. Inicia sesión de nuevo.',
        401,
        serverCode
      );
    }
    if (error.status === 403) {
      return new TrustError(
        'FORBIDDEN',
        'Tu cuenta no tiene permiso para completar esta operación.',
        403,
        serverCode,
        serverMessage
      );
    }
    if (error.status === 404) {
      return new TrustError(
        'NOT_FOUND',
        serverMessage ?? 'La información ya no está disponible.',
        404,
        serverCode,
        serverMessage
      );
    }
    if (error.status === 409) {
      return new TrustError(
        'CONFLICT',
        conflictMessage(serverCode),
        409,
        serverCode,
        serverMessage
      );
    }
    if (error.status === 400) {
      return new TrustError(
        'VALIDATION',
        serverMessage ?? 'Revisa los datos ingresados e intenta de nuevo.',
        400,
        serverCode,
        serverMessage
      );
    }
    if (error.status === 413) {
      return new TrustError(
        'TOO_LARGE',
        'El archivo supera el tamaño permitido.',
        413,
        serverCode,
        serverMessage
      );
    }
    if (error.status === 415) {
      return new TrustError(
        'UNSUPPORTED',
        'El formato del archivo no es compatible.',
        415,
        serverCode,
        serverMessage
      );
    }
    return new TrustError('UNKNOWN', fallback, error.status, serverCode, serverMessage);
  }
  if (error instanceof Error && error.name === 'AbortError') {
    return new TrustError('NETWORK', 'La solicitud tardó demasiado. Intenta de nuevo.');
  }
  return new TrustError(
    'NETWORK',
    'No se pudo conectar con ALIADO. Revisa tu conexión e intenta de nuevo.'
  );
}

function requireBaseUrl(baseUrl?: string): string {
  if (!baseUrl) {
    throw new TrustError(
      'CONFIGURATION',
      'No podemos completar esta operación en este momento. Intenta de nuevo más tarde.'
    );
  }
  return baseUrl;
}

function uploadVerification(
  baseUrl: string,
  token: string,
  documentos: VerificationDocument[]
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${baseUrl}/api/v1/verificaciones`);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.timeout = 60000;

    xhr.onload = () => {
      let body: unknown = null;
      if (xhr.responseText) {
        try {
          body = JSON.parse(xhr.responseText) as unknown;
        } catch {
          body = xhr.responseText;
        }
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(body);
        return;
      }
      reject(new ApiError(xhr.status, body));
    };

    xhr.onerror = () => {
      reject(
        new TrustError(
          'NETWORK',
          'No se pudo conectar con ALIADO. Revisa tu conexión e intenta de nuevo.'
        )
      );
    };
    xhr.ontimeout = () => {
      reject(
        new TrustError('NETWORK', 'La carga de documentos tardó demasiado. Intenta de nuevo.')
      );
    };
    xhr.onabort = () => {
      reject(new TrustError('NETWORK', 'La carga de documentos se canceló.'));
    };

    const formData = new FormData();
    documentos.forEach((documento) => {
      formData.append(
        'documentos',
        {
          uri: documento.uri,
          name: documento.name,
          type: documento.type || 'application/octet-stream',
        } as unknown as Blob
      );
    });
    xhr.send(formData);
  });
}

export class HttpTrustGateway implements TrustGateway {
  private readonly baseUrl?: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl;
  }

  async calificar(token: string, servicioId: string, valor: number): Promise<RatingResult> {
    try {
      const response = await requestJson<unknown>(
        requireBaseUrl(this.baseUrl),
        `/api/v1/servicios/${encodeURIComponent(servicioId)}/calificacion`,
        { method: 'POST', token, body: { valor } }
      );
      return parseRating(response);
    } catch (error) {
      throw mapApiError(error, 'No fue posible registrar la calificación.');
    }
  }

  async agregarResena(
    token: string,
    calificacionId: string,
    texto: string
  ): Promise<ReviewResult> {
    try {
      const response = await requestJson<unknown>(
        requireBaseUrl(this.baseUrl),
        `/api/v1/calificaciones/${encodeURIComponent(calificacionId)}/resena`,
        { method: 'POST', token, body: { texto } }
      );
      return parseReviewResult(response);
    } catch (error) {
      throw mapApiError(error, 'No fue posible registrar la reseña.');
    }
  }

  async getMiVerificacion(token: string): Promise<VerificationRequest> {
    try {
      const response = await requestJson<unknown>(
        requireBaseUrl(this.baseUrl),
        '/api/v1/verificaciones/mia',
        { method: 'GET', token }
      );
      return parseVerification(response);
    } catch (error) {
      throw mapApiError(error, 'No fue posible consultar tu verificación.');
    }
  }

  async solicitarVerificacion(
    token: string,
    documentos: VerificationDocument[]
  ): Promise<VerificationRequest> {
    try {
      const response = await uploadVerification(
        requireBaseUrl(this.baseUrl),
        token,
        documentos
      );
      return parseVerification(response);
    } catch (error) {
      throw mapApiError(error, 'No fue posible enviar la solicitud de verificación.');
    }
  }

  async reportarResena(
    token: string,
    resenaId: string,
    motivo: string
  ): Promise<ReportReviewResult> {
    try {
      const response = await requestJson<unknown>(
        requireBaseUrl(this.baseUrl),
        `/api/v1/resenas/${encodeURIComponent(resenaId)}/reportes`,
        { method: 'POST', token, body: { motivo } }
      );
      return parseReport(response);
    } catch (error) {
      throw mapApiError(error, 'No fue posible registrar el reporte.');
    }
  }

  async getMyRatings(
    token: string,
    pagina: number,
    tamano: number
  ): Promise<ClientRatingHistoryPage> {
    try {
      const response = await requestJson<unknown>(
        requireBaseUrl(this.baseUrl),
        `/api/v1/calificaciones/mias?pagina=${pagina}&tamano=${tamano}`,
        { method: 'GET', token }
      );
      return parseClientRatingHistoryPage(response);
    } catch (error) {
      if (error instanceof ApiError) {
        const serverCode = getServerCode(error.body);
        const serverPath = getServerPath(error.body);
        const missingOperation =
          error.status === 404 ||
          (error.status === 500 &&
            serverCode === 'ERROR_INTERNO' &&
            serverPath === '/api/v1/calificaciones/mias');
        if (missingOperation) {
          throw new TrustError(
            'NOT_AVAILABLE',
            'El historial de calificaciones todavía no está disponible.',
            error.status,
            serverCode,
            getServerMessage(error.body)
          );
        }
      }
      throw mapApiError(error, 'No fue posible cargar tus calificaciones y reseñas.');
    }
  }
}
