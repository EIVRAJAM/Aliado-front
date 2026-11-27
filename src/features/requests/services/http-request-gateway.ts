import { ApiError, requestJson } from '../../../shared/api/http-client';
import {
  RequestError,
  isRequestStatus,
  isRequestUrgency,
  type CatalogCategory,
  type CatalogZone,
  type CreateServiceRequestInput,
  type LocalPhoto,
  type RequestCatalogs,
  type ServiceRequest,
  type UpdateServiceRequestInput,
  type UploadedPhoto,
} from '../types/request';
import type { RequestGateway } from './request-gateway';

const SERVER_IDEMPOTENCY_SUPPORTED = false;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function nullableString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== 'string') {
    throw new RequestError('UNKNOWN', 'No pudimos interpretar la respuesta de ALIADO. Intenta de nuevo.');
  }
  return value;
}

function requiredString(value: unknown): string {
  if (typeof value !== 'string' || !value) {
    throw new RequestError('UNKNOWN', 'No pudimos interpretar la respuesta de ALIADO. Intenta de nuevo.');
  }
  return value;
}

function parsePhotos(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (typeof item === 'string') {
      return [item];
    }
    if (isRecord(item) && typeof item.archivoKey === 'string') {
      return [item.archivoKey];
    }
    return [];
  });
}

function parseRequest(value: unknown): ServiceRequest {
  if (
    !isRecord(value) ||
    !isRequestStatus(value.estado) ||
    (value.urgencia !== null && value.urgencia !== undefined && !isRequestUrgency(value.urgencia))
  ) {
    throw new RequestError('UNKNOWN', 'No pudimos interpretar la respuesta de ALIADO. Intenta de nuevo.');
  }

  return {
    id: requiredString(value.id),
    clienteId: requiredString(value.clienteId),
    categoriaId: nullableString(value.categoriaId),
    zonaId: nullableString(value.zonaId),
    descripcion: nullableString(value.descripcion),
    urgencia: value.urgencia === null || value.urgencia === undefined ? null : value.urgencia,
    estado: value.estado,
    fechaCreacion: requiredString(value.fechaCreacion),
    fechaActualizacion: requiredString(value.fechaActualizacion),
    fotos: parsePhotos(value.fotos),
  };
}

function parseCategory(value: unknown): CatalogCategory {
  if (!isRecord(value)) {
    throw new RequestError('UNKNOWN', 'No pudimos interpretar la respuesta de ALIADO. Intenta de nuevo.');
  }
  return {
    id: requiredString(value.id),
    nombre: requiredString(value.nombre),
  };
}

function parseZone(value: unknown): CatalogZone {
  if (!isRecord(value)) {
    throw new RequestError('UNKNOWN', 'No pudimos interpretar la respuesta de ALIADO. Intenta de nuevo.');
  }
  return {
    id: requiredString(value.id),
    nombre: requiredString(value.nombre),
    coberturaGeografica: nullableString(value.coberturaGeografica),
  };
}

function parseCatalogs(
  categories: unknown,
  zones: unknown
): RequestCatalogs {
  if (!Array.isArray(categories) || !Array.isArray(zones)) {
    throw new RequestError('UNKNOWN', 'No pudimos interpretar la respuesta de ALIADO. Intenta de nuevo.');
  }
  return {
    categories: categories.map(parseCategory),
    zones: zones.map(parseZone),
  };
}

function parseUploadedPhoto(value: unknown): UploadedPhoto {
  if (!isRecord(value)) {
    throw new RequestError('UNKNOWN', 'No pudimos interpretar la respuesta de ALIADO. Intenta de nuevo.');
  }
  return {
    id: requiredString(value.id),
    archivoKey: requiredString(value.archivoKey),
    orden: typeof value.orden === 'number' ? value.orden : 0,
  };
}

function getServerCode(body: unknown): string | undefined {
  if (isRecord(body) && typeof body.code === 'string') {
    return body.code;
  }
  return undefined;
}

function getServerMessage(body: unknown): string | undefined {
  if (isRecord(body) && typeof body.message === 'string' && body.message.trim()) {
    return body.message;
  }
  return undefined;
}

function mapApiError(error: unknown, fallbackMessage: string): RequestError {
  if (error instanceof RequestError) {
    return error;
  }

  if (error instanceof ApiError) {
    const serverCode = getServerCode(error.body);
    const serverMessage = getServerMessage(error.body);

    if (error.status === 401) {
      return new RequestError(
        'SESSION_EXPIRED',
        'Tu sesión expiró. Inicia sesión de nuevo.',
        401,
        serverCode
      );
    }

    if (error.status === 403) {
      return new RequestError(
        'FORBIDDEN',
        'Tu cuenta no tiene permiso para gestionar solicitudes.',
        403,
        serverCode
      );
    }

    if (error.status === 404) {
      return new RequestError(
        'NOT_FOUND',
        'La solicitud no existe o no te pertenece.',
        404,
        serverCode
      );
    }

    if (error.status === 409) {
      const message =
        serverCode === 'SOLICITUD_CERRADA'
          ? 'La solicitud ya no admite cambios.'
          : serverCode === 'TRANSICION_INVALIDA'
            ? 'La solicitud ya no se puede publicar o cancelar en su estado actual.'
            : 'La solicitud cambió de estado. Vuelve a cargarla.';
      return new RequestError('CONFLICT', message, 409, serverCode);
    }

    if (error.status === 400) {
      return new RequestError(
        'VALIDATION',
        serverMessage ?? 'Revisa los datos ingresados e intenta de nuevo.',
        400,
        serverCode
      );
    }

    if (error.status === 413) {
      return new RequestError(
        'VALIDATION',
        'La imagen supera el límite de 5 MB.',
        413,
        serverCode
      );
    }

    if (error.status === 415) {
      return new RequestError(
        'VALIDATION',
        'El formato de la imagen no es compatible. Usa JPG, PNG o WebP.',
        415,
        serverCode
      );
    }

    return new RequestError('UNKNOWN', fallbackMessage, error.status, serverCode);
  }

  if (error instanceof Error && error.name === 'AbortError') {
    return new RequestError('NETWORK', 'La solicitud tardó demasiado. Intenta de nuevo.');
  }

  return new RequestError(
    'NETWORK',
    'No se pudo conectar con ALIADO. Revisa tu conexión e intenta de nuevo.'
  );
}

export class HttpRequestGateway implements RequestGateway {
  private readonly baseUrl?: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl;
  }

  private requireBaseUrl(): string {
    if (!this.baseUrl) {
      throw new RequestError(
        'CONFIGURATION',
        'No podemos gestionar solicitudes en este momento. Intenta de nuevo más tarde.'
      );
    }
    return this.baseUrl;
  }

  async getCatalogs(token: string): Promise<RequestCatalogs> {
    try {
      const [categories, zones] = await Promise.all([
        requestJson<unknown>(this.requireBaseUrl(), '/api/v1/catalogo/categorias', {
          method: 'GET',
          token,
        }),
        requestJson<unknown>(this.requireBaseUrl(), '/api/v1/catalogo/zonas', {
          method: 'GET',
          token,
        }),
      ]);
      return parseCatalogs(categories, zones);
    } catch (error) {
      throw mapApiError(error, 'No fue posible cargar el catálogo. Intenta de nuevo.');
    }
  }

  async listMine(token: string): Promise<ServiceRequest[]> {
    try {
      const response = await requestJson<unknown>(this.requireBaseUrl(), '/api/v1/solicitudes/mias', {
        method: 'GET',
        token,
      });
      if (!Array.isArray(response)) {
        throw new RequestError('UNKNOWN', 'No pudimos interpretar la respuesta de ALIADO. Intenta de nuevo.');
      }
      return response.map(parseRequest);
    } catch (error) {
      throw mapApiError(error, 'No fue posible cargar tus solicitudes. Intenta de nuevo.');
    }
  }

  async getMine(token: string, requestId: string): Promise<ServiceRequest> {
    try {
      const response = await requestJson<unknown>(
        this.requireBaseUrl(),
        `/api/v1/solicitudes/mias/${encodeURIComponent(requestId)}`,
        {
          method: 'GET',
          token,
        }
      );
      return parseRequest(response);
    } catch (error) {
      throw mapApiError(error, 'No fue posible cargar la solicitud. Intenta de nuevo.');
    }
  }

  async create(
    token: string,
    input: CreateServiceRequestInput,
    idempotencyKey: string
  ): Promise<ServiceRequest> {
    try {
      const response = await requestJson<unknown>(this.requireBaseUrl(), '/api/v1/solicitudes', {
        method: 'POST',
        token,
        headers: SERVER_IDEMPOTENCY_SUPPORTED
          ? { 'Idempotency-Key': idempotencyKey }
          : undefined,
        body: {
          categoriaId: input.categoriaId,
          descripcion: input.descripcion,
          zonaId: input.zonaId,
          urgencia: input.urgencia,
          estadoDeseado: input.estadoDeseado,
        },
      });
      return parseRequest(response);
    } catch (error) {
      throw mapApiError(error, 'No fue posible guardar la solicitud. Intenta de nuevo.');
    }
  }

  async update(
    token: string,
    requestId: string,
    input: UpdateServiceRequestInput
  ): Promise<ServiceRequest> {
    try {
      const response = await requestJson<unknown>(
        this.requireBaseUrl(),
        `/api/v1/solicitudes/${encodeURIComponent(requestId)}`,
        {
          method: 'PUT',
          token,
          body: {
            categoriaId: input.categoriaId,
            descripcion: input.descripcion,
            zonaId: input.zonaId,
            urgencia: input.urgencia,
          },
        }
      );
      return parseRequest(response);
    } catch (error) {
      throw mapApiError(error, 'No fue posible actualizar la solicitud. Intenta de nuevo.');
    }
  }

  async publish(token: string, requestId: string): Promise<ServiceRequest> {
    try {
      const response = await requestJson<unknown>(
        this.requireBaseUrl(),
        `/api/v1/solicitudes/${encodeURIComponent(requestId)}/publicar`,
        {
          method: 'POST',
          token,
        }
      );
      return parseRequest(response);
    } catch (error) {
      throw mapApiError(error, 'No fue posible publicar la solicitud. Intenta de nuevo.');
    }
  }

  async cancel(token: string, requestId: string): Promise<void> {
    try {
      await requestJson<unknown>(
        this.requireBaseUrl(),
        `/api/v1/solicitudes/${encodeURIComponent(requestId)}/cancelar`,
        {
          method: 'POST',
          token,
        }
      );
    } catch (error) {
      throw mapApiError(error, 'No fue posible cancelar la solicitud. Intenta de nuevo.');
    }
  }

  uploadPhoto(
    token: string,
    requestId: string,
    photo: LocalPhoto,
    onProgress?: (fraction: number) => void
  ): Promise<UploadedPhoto> {
    const baseUrl = this.requireBaseUrl();

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(
        'POST',
        `${baseUrl.replace(/\/+$/, '')}/api/v1/solicitudes/${encodeURIComponent(requestId)}/fotos`
      );
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.timeout = 60000;

      xhr.upload.onprogress = (event) => {
        if (onProgress && event.lengthComputable && event.total > 0) {
          onProgress(Math.min(1, event.loaded / event.total));
        }
      };

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
          try {
            resolve(parseUploadedPhoto(body));
          } catch (parseError) {
            reject(
              parseError instanceof RequestError
                ? parseError
                : new RequestError(
                    'UNKNOWN',
                    'No pudimos interpretar la respuesta de ALIADO. Intenta de nuevo.'
                  )
            );
          }
          return;
        }

        reject(
          mapApiError(
            new ApiError(xhr.status, body),
            'No fue posible subir la foto. Intenta de nuevo.'
          )
        );
      };

      xhr.onerror = () => {
        reject(
          new RequestError(
            'NETWORK',
            'No se pudo conectar con ALIADO. Revisa tu conexión e intenta de nuevo.'
          )
        );
      };

      xhr.ontimeout = () => {
        reject(new RequestError('NETWORK', 'La carga de la foto tardó demasiado. Intenta de nuevo.'));
      };

      xhr.onabort = () => {
        reject(new RequestError('NETWORK', 'La carga de la foto se canceló.'));
      };

      const formData = new FormData();
      formData.append(
        'archivo',
        {
          uri: photo.uri,
          name: photo.name,
          type: photo.type,
        } as unknown as Blob
      );
      xhr.send(formData);
    });
  }
}
