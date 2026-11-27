import { ApiError, requestJson } from '../../../shared/api/http-client';
import {
  ReportError,
  type CreatedReport,
  type EvidenceDocument,
  type ReportDetail,
  type ReportEvidence,
  type ReportType,
  type UploadedEvidence,
} from '../types/report';
import type { ReportGateway } from './report-gateway';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function requiredString(value: unknown): string {
  if (typeof value !== 'string' || !value) {
    throw new ReportError(
      'INVALID_RESPONSE',
      'No pudimos interpretar la respuesta de ALIADO. Intenta de nuevo.'
    );
  }
  return value;
}

function getServerCode(body: unknown): string | undefined {
  return isRecord(body) && typeof body.code === 'string' ? body.code : undefined;
}

function getServerMessage(body: unknown): string | undefined {
  return isRecord(body) && typeof body.message === 'string' && body.message.trim()
    ? body.message
    : undefined;
}

function parseCreatedReport(value: unknown): CreatedReport {
  if (!isRecord(value)) {
    throw new ReportError(
      'INVALID_RESPONSE',
      'No pudimos interpretar la respuesta de ALIADO. Intenta de nuevo.'
    );
  }
  return { reporteId: requiredString(value.reporteId) };
}

function parseEvidence(value: unknown): ReportEvidence {
  if (!isRecord(value)) {
    throw new ReportError(
      'INVALID_RESPONSE',
      'No pudimos interpretar la respuesta de ALIADO. Intenta de nuevo.'
    );
  }
  return {
    id: requiredString(value.id),
    archivoKey: requiredString(value.archivoKey),
    tipoContenido: requiredString(value.tipoContenido),
  };
}

function parseUploadedEvidence(value: unknown): UploadedEvidence {
  return parseEvidence(value);
}

function parseReportType(value: unknown): ReportType {
  if (value === 'USUARIO' || value === 'SERVICIO' || value === 'RESENA') {
    return value;
  }
  throw new ReportError(
    'INVALID_RESPONSE',
    'No pudimos interpretar la respuesta de ALIADO. Intenta de nuevo.'
  );
}

function parseReportDetail(value: unknown): ReportDetail {
  if (!isRecord(value) || !Array.isArray(value.evidencias)) {
    throw new ReportError(
      'INVALID_RESPONSE',
      'No pudimos interpretar la respuesta de ALIADO. Intenta de nuevo.'
    );
  }
  return {
    id: requiredString(value.id),
    tipo: parseReportType(value.tipo),
    objetivoId: requiredString(value.objetivoId),
    motivo: requiredString(value.motivo),
    estado: requiredString(value.estado),
    fechaCreacion: requiredString(value.fechaCreacion),
    evidencias: value.evidencias.map(parseEvidence),
  };
}

function conflictMessage(serverCode?: string): string {
  if (serverCode === 'REPORTE_CERRADO') {
    return 'El reporte ya está cerrado y no admite más evidencia.';
  }
  return 'La operación no se puede completar en el estado actual.';
}

function mapApiError(error: unknown, fallback: string): ReportError {
  if (error instanceof ReportError) {
    return error;
  }
  if (error instanceof ApiError) {
    const serverCode = getServerCode(error.body);
    const serverMessage = getServerMessage(error.body);
    if (error.status === 401) {
      return new ReportError(
        'SESSION_EXPIRED',
        'Tu sesión expiró. Inicia sesión de nuevo.',
        401,
        serverCode
      );
    }
    if (error.status === 403) {
      return new ReportError(
        'FORBIDDEN',
        serverMessage ?? 'No tienes permiso para realizar esta operación.',
        403,
        serverCode,
        serverMessage
      );
    }
    if (error.status === 404) {
      return new ReportError(
        'NOT_FOUND',
        serverMessage ?? 'La información ya no está disponible.',
        404,
        serverCode,
        serverMessage
      );
    }
    if (error.status === 409) {
      return new ReportError(
        'CONFLICT',
        conflictMessage(serverCode),
        409,
        serverCode,
        serverMessage
      );
    }
    if (error.status === 400) {
      return new ReportError(
        'VALIDATION',
        serverMessage ?? 'Revisa los datos ingresados e intenta de nuevo.',
        400,
        serverCode,
        serverMessage
      );
    }
    if (error.status === 413) {
      return new ReportError(
        'TOO_LARGE',
        'El archivo supera el tamaño permitido.',
        413,
        serverCode,
        serverMessage
      );
    }
    if (error.status === 415) {
      return new ReportError(
        'UNSUPPORTED',
        'El formato del archivo no es compatible.',
        415,
        serverCode,
        serverMessage
      );
    }
    return new ReportError('UNKNOWN', fallback, error.status, serverCode, serverMessage);
  }
  if (error instanceof Error && error.name === 'AbortError') {
    return new ReportError('NETWORK', 'La solicitud tardó demasiado. Intenta de nuevo.');
  }
  return new ReportError(
    'NETWORK',
    'No se pudo conectar con ALIADO. Revisa tu conexión e intenta de nuevo.'
  );
}

function requireBaseUrl(baseUrl?: string): string {
  if (!baseUrl) {
    throw new ReportError(
      'CONFIGURATION',
      'No podemos gestionar reportes en este momento. Intenta de nuevo más tarde.'
    );
  }
  return baseUrl;
}

function uploadEvidence(
  baseUrl: string,
  token: string,
  reportId: string,
  document: EvidenceDocument
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(
      'POST',
      `${baseUrl}/api/v1/reportes/${encodeURIComponent(reportId)}/evidencias`
    );
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
        new ReportError(
          'NETWORK',
          'No se pudo conectar con ALIADO. Revisa tu conexión e intenta de nuevo.'
        )
      );
    };
    xhr.ontimeout = () => {
      reject(
        new ReportError('NETWORK', 'La carga de la evidencia tardó demasiado. Intenta de nuevo.')
      );
    };
    xhr.onabort = () => {
      reject(new ReportError('NETWORK', 'La carga de la evidencia se canceló.'));
    };

    const formData = new FormData();
    formData.append(
      'archivo',
      {
        uri: document.uri,
        name: document.name,
        type: document.type || 'application/octet-stream',
      } as unknown as Blob
    );
    xhr.send(formData);
  });
}

export class HttpReportGateway implements ReportGateway {
  private readonly baseUrl?: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl;
  }

  async reportUser(token: string, userId: string, motivo: string): Promise<CreatedReport> {
    try {
      const response = await requestJson<unknown>(
        requireBaseUrl(this.baseUrl),
        `/api/v1/usuarios/${encodeURIComponent(userId)}/reportes`,
        { method: 'POST', token, body: { motivo } }
      );
      return parseCreatedReport(response);
    } catch (error) {
      throw mapApiError(error, 'No fue posible registrar el reporte de la cuenta.');
    }
  }

  async reportService(
    token: string,
    serviceId: string,
    motivo: string
  ): Promise<CreatedReport> {
    try {
      const response = await requestJson<unknown>(
        requireBaseUrl(this.baseUrl),
        `/api/v1/servicios/${encodeURIComponent(serviceId)}/reportes`,
        { method: 'POST', token, body: { motivo } }
      );
      return parseCreatedReport(response);
    } catch (error) {
      throw mapApiError(error, 'No fue posible registrar el reporte del servicio.');
    }
  }

  async uploadEvidence(
    token: string,
    reportId: string,
    document: EvidenceDocument
  ): Promise<UploadedEvidence> {
    try {
      const response = await uploadEvidence(
        requireBaseUrl(this.baseUrl),
        token,
        reportId,
        document
      );
      return parseUploadedEvidence(response);
    } catch (error) {
      throw mapApiError(error, 'No fue posible adjuntar la evidencia.');
    }
  }

  async getMyReport(token: string, reportId: string): Promise<ReportDetail> {
    try {
      const response = await requestJson<unknown>(
        requireBaseUrl(this.baseUrl),
        `/api/v1/reportes/mios/${encodeURIComponent(reportId)}`,
        { method: 'GET', token }
      );
      return parseReportDetail(response);
    } catch (error) {
      throw mapApiError(error, 'No fue posible consultar el estado del reporte.');
    }
  }
}
