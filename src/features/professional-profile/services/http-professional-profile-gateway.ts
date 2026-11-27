import { ApiError, requestJson } from '../../../shared/api/http-client';
import {
  ProfessionalProfileError,
  type AgendaCommitment,
  type AvailabilityBlock,
  type AvailabilityBlockInput,
  type CommitmentInput,
  type CreateProfessionalProfileInput,
  type CreatedProfessionalProfile,
  type OwnProfessionalProfile,
  type ProfessionalCatalogs,
  type ProfessionalPreview,
  type PublicReview,
} from '../types/professional-profile';
import type { ProfessionalProfileGateway } from './professional-profile-gateway';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function requiredString(value: unknown): string {
  if (typeof value !== 'string' || !value) {
    throw new ProfessionalProfileError(
      'UNKNOWN',
      'No pudimos interpretar la respuesta de ALIADO. Intenta de nuevo.'
    );
  }
  return value;
}

function nullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new ProfessionalProfileError(
      'UNKNOWN',
      'No pudimos interpretar la respuesta de ALIADO. Intenta de nuevo.'
    );
  }
  return value;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    throw new ProfessionalProfileError(
      'UNKNOWN',
      'No pudimos interpretar la respuesta de ALIADO. Intenta de nuevo.'
    );
  }
  return value.filter((item): item is string => typeof item === 'string');
}

function parseAvailability(value: unknown): AvailabilityBlock[] {
  if (!Array.isArray(value)) {
    throw new ProfessionalProfileError(
      'UNKNOWN',
      'No pudimos interpretar la respuesta de ALIADO. Intenta de nuevo.'
    );
  }
  return value.map((item) => {
    if (!isRecord(item)) {
      throw new ProfessionalProfileError(
        'UNKNOWN',
        'No pudimos interpretar la respuesta de ALIADO. Intenta de nuevo.'
      );
    }
    return {
      id: typeof item.id === 'string' ? item.id : null,
      diaSemana: nullableNumber(item.diaSemana),
      horaInicio: requiredString(item.horaInicio),
      horaFin: requiredString(item.horaFin),
    };
  });
}

function parseReviews(value: unknown): PublicReview[] {
  if (!Array.isArray(value)) {
    throw new ProfessionalProfileError(
      'UNKNOWN',
      'No pudimos interpretar la respuesta de ALIADO. Intenta de nuevo.'
    );
  }
  return value.map((item) => {
    if (
      !isRecord(item) ||
      typeof item.valor !== 'number' ||
      typeof item.texto !== 'string' ||
      typeof item.fechaCreacion !== 'string'
    ) {
      throw new ProfessionalProfileError(
        'UNKNOWN',
        'No pudimos interpretar la respuesta de ALIADO. Intenta de nuevo.'
      );
    }
    return {
      id: requiredString(item.id),
      valor: item.valor,
      texto: item.texto,
      fechaCreacion: item.fechaCreacion,
    };
  });
}

function parsePreview(value: unknown): ProfessionalPreview {
  if (
    !isRecord(value) ||
    typeof value.reputacion !== 'number' ||
    typeof value.cantidadCalificaciones !== 'number' ||
    typeof value.nivelVerificacion !== 'string'
  ) {
    throw new ProfessionalProfileError(
      'UNKNOWN',
      'No pudimos interpretar la respuesta de ALIADO. Intenta de nuevo.'
    );
  }

  return {
    prestadorId: requiredString(value.prestadorId),
    categorias: stringArray(value.categorias),
    zonas: stringArray(value.zonas),
    reputacion: value.reputacion,
    cantidadCalificaciones: value.cantidadCalificaciones,
    nivelVerificacion: value.nivelVerificacion,
    disponibilidad: parseAvailability(value.disponibilidad),
    datosGenerales: isRecord(value.datosGenerales) ? value.datosGenerales : {},
    resenas: parseReviews(value.resenas),
  };
}

function parseCommitment(value: unknown): AgendaCommitment {
  if (!isRecord(value)) {
    throw new ProfessionalProfileError(
      'UNKNOWN',
      'No pudimos interpretar la respuesta de ALIADO. Intenta de nuevo.'
    );
  }
  return {
    id: requiredString(value.id),
    fechaHoraInicio: requiredString(value.fechaHoraInicio),
    fechaHoraFin: requiredString(value.fechaHoraFin),
    origen: requiredString(value.origen),
  };
}

function parseAgenda(value: unknown): AgendaCommitment[] {
  if (!Array.isArray(value)) {
    throw new ProfessionalProfileError(
      'UNKNOWN',
      'No pudimos interpretar la respuesta de ALIADO. Intenta de nuevo.'
    );
  }
  return value.map(parseCommitment);
}

function parseCategory(value: unknown) {
  if (!isRecord(value)) {
    throw new ProfessionalProfileError(
      'UNKNOWN',
      'No pudimos interpretar la respuesta de ALIADO. Intenta de nuevo.'
    );
  }
  return {
    id: requiredString(value.id),
    nombre: requiredString(value.nombre),
  };
}

function parseZone(value: unknown) {
  if (!isRecord(value)) {
    throw new ProfessionalProfileError(
      'UNKNOWN',
      'No pudimos interpretar la respuesta de ALIADO. Intenta de nuevo.'
    );
  }
  return {
    id: requiredString(value.id),
    nombre: requiredString(value.nombre),
    coberturaGeografica:
      typeof value.coberturaGeografica === 'string' ? value.coberturaGeografica : null,
  };
}

function parseCatalogs(categories: unknown, zones: unknown): ProfessionalCatalogs {
  if (!Array.isArray(categories) || !Array.isArray(zones)) {
    throw new ProfessionalProfileError(
      'UNKNOWN',
      'No pudimos interpretar la respuesta de ALIADO. Intenta de nuevo.'
    );
  }
  return {
    categories: categories.map(parseCategory),
    zones: zones.map(parseZone),
  };
}

function parseOwnProfile(value: unknown): OwnProfessionalProfile {
  if (!isRecord(value)) {
    throw new ProfessionalProfileError(
      'UNKNOWN',
      'No pudimos interpretar la respuesta de ALIADO. Intenta de nuevo.'
    );
  }
  const datos = isRecord(value.datosGenerales) ? value.datosGenerales : {};
  return {
    id: requiredString(value.id),
    prestadorId: requiredString(value.prestadorId),
    descripcion: typeof datos.descripcion === 'string' ? datos.descripcion : null,
    disponibilidades: parseAvailability(value.disponibilidades),
  };
}

function parseCreatedProfile(value: unknown): CreatedProfessionalProfile {
  if (!isRecord(value)) {
    throw new ProfessionalProfileError(
      'UNKNOWN',
      'No pudimos interpretar la respuesta de ALIADO. Intenta de nuevo.'
    );
  }
  return {
    id: requiredString(value.id),
    prestadorId: requiredString(value.prestadorId),
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

function mapApiError(error: unknown, fallback: string): ProfessionalProfileError {
  if (error instanceof ProfessionalProfileError) {
    return error;
  }

  if (error instanceof ApiError) {
    const serverCode = getServerCode(error.body);

    if (error.status === 401) {
      return new ProfessionalProfileError(
        'SESSION_EXPIRED',
        'Tu sesión expiró. Inicia sesión de nuevo.',
        401,
        serverCode
      );
    }
    if (error.status === 403) {
      return new ProfessionalProfileError(
        'FORBIDDEN',
        'Esta sección está disponible para cuentas de prestador.',
        403,
        serverCode
      );
    }
    if (error.status === 404) {
      return new ProfessionalProfileError(
        'NOT_FOUND',
        serverCode === 'COMPROMISO_NO_ENCONTRADO'
          ? getServerMessage(error.body) ?? 'El compromiso ya no está disponible.'
          : 'Todavía no tienes un perfil profesional.',
        404,
        serverCode
      );
    }
    if (error.status === 409) {
      if (serverCode === 'CONFLICTO_AGENDA') {
        return new ProfessionalProfileError(
          'CONFLICT',
          getServerMessage(error.body) ?? 'El horario se solapa con otro compromiso.',
          409,
          serverCode
        );
      }
      return new ProfessionalProfileError(
        'PROFILE_ALREADY_EXISTS',
        'Ya tienes un perfil profesional.',
        409,
        serverCode
      );
    }
    if (error.status === 400) {
      return new ProfessionalProfileError(
        'VALIDATION',
        getServerMessage(error.body) ?? 'Revisa los datos ingresados e intenta de nuevo.',
        400,
        serverCode
      );
    }

    return new ProfessionalProfileError('UNKNOWN', fallback, error.status, serverCode);
  }

  if (error instanceof Error && error.name === 'AbortError') {
    return new ProfessionalProfileError('NETWORK', 'La solicitud tardó demasiado. Intenta de nuevo.');
  }

  return new ProfessionalProfileError(
    'NETWORK',
    'No se pudo conectar con ALIADO. Revisa tu conexión e intenta de nuevo.'
  );
}

export class HttpProfessionalProfileGateway implements ProfessionalProfileGateway {
  private readonly baseUrl?: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl;
  }

  private requireBaseUrl(): string {
    if (!this.baseUrl) {
      throw new ProfessionalProfileError(
        'CONFIGURATION',
        'No podemos cargar tu perfil profesional en este momento. Intenta de nuevo más tarde.'
      );
    }
    return this.baseUrl;
  }

  async getCatalogs(token: string): Promise<ProfessionalCatalogs> {
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
      throw mapApiError(error, 'No fue posible cargar el catálogo de perfil.');
    }
  }

  async getOwnProfile(token: string): Promise<OwnProfessionalProfile> {
    try {
      const response = await requestJson<unknown>(this.requireBaseUrl(), '/api/v1/perfiles/mio', {
        method: 'GET',
        token,
      });
      return parseOwnProfile(response);
    } catch (error) {
      throw mapApiError(error, 'No fue posible cargar tu perfil profesional.');
    }
  }

  async getPreview(token: string): Promise<ProfessionalPreview> {
    try {
      const response = await requestJson<unknown>(
        this.requireBaseUrl(),
        '/api/v1/perfiles/mio/vista-previa',
        { method: 'GET', token }
      );
      return parsePreview(response);
    } catch (error) {
      throw mapApiError(error, 'No fue posible cargar la vista previa del perfil.');
    }
  }

  async createProfile(
    token: string,
    input: CreateProfessionalProfileInput
  ): Promise<CreatedProfessionalProfile> {
    try {
      const response = await requestJson<unknown>(this.requireBaseUrl(), '/api/v1/perfiles', {
        method: 'POST',
        token,
        body: {
          categoriaIds: input.categoriaIds,
          zonaIds: input.zonaIds,
          datosGenerales: input.descripcion?.trim()
            ? { descripcion: input.descripcion.trim() }
            : {},
        },
      });
      return parseCreatedProfile(response);
    } catch (error) {
      throw mapApiError(error, 'No fue posible crear el perfil profesional.');
    }
  }

  async updateDescription(
    token: string,
    descripcion: string | null
  ): Promise<OwnProfessionalProfile> {
    try {
      const response = await requestJson<unknown>(this.requireBaseUrl(), '/api/v1/perfiles/mio', {
        method: 'PUT',
        token,
        body: {
          datosGenerales: { descripcion: descripcion?.trim() || null },
        },
      });
      return parseOwnProfile(response);
    } catch (error) {
      throw mapApiError(error, 'No fue posible actualizar la descripción profesional.');
    }
  }

  async getAgenda(token: string): Promise<AgendaCommitment[]> {
    try {
      const response = await requestJson<unknown>(
        this.requireBaseUrl(),
        '/api/v1/perfiles/mio/agenda',
        { method: 'GET', token }
      );
      return parseAgenda(response);
    } catch (error) {
      throw mapApiError(error, 'No fue posible cargar la agenda.');
    }
  }

  async updateAvailability(
    token: string,
    bloques: AvailabilityBlockInput[]
  ): Promise<OwnProfessionalProfile> {
    try {
      const response = await requestJson<unknown>(
        this.requireBaseUrl(),
        '/api/v1/perfiles/mio/disponibilidad',
        { method: 'PUT', token, body: { bloques } }
      );
      return parseOwnProfile(response);
    } catch (error) {
      throw mapApiError(error, 'No fue posible guardar la disponibilidad.');
    }
  }

  async createCommitment(
    token: string,
    input: CommitmentInput
  ): Promise<AgendaCommitment> {
    try {
      const response = await requestJson<unknown>(
        this.requireBaseUrl(),
        '/api/v1/perfiles/mio/agenda',
        { method: 'POST', token, body: input }
      );
      return parseCommitment(response);
    } catch (error) {
      throw mapApiError(error, 'No fue posible crear el compromiso.');
    }
  }

  async updateCommitment(
    token: string,
    commitmentId: string,
    input: CommitmentInput
  ): Promise<AgendaCommitment> {
    try {
      const response = await requestJson<unknown>(
        this.requireBaseUrl(),
        '/api/v1/perfiles/mio/agenda',
        { method: 'PUT', token, body: { id: commitmentId, ...input } }
      );
      const commitment = parseCommitment(response);
      if (commitment.id !== commitmentId) {
        throw new ProfessionalProfileError(
          'UNKNOWN',
          'La respuesta no corresponde al compromiso solicitado.'
        );
      }
      return commitment;
    } catch (error) {
      throw mapApiError(error, 'No fue posible actualizar el compromiso.');
    }
  }
}
