import {
  isProgressMissing,
  type FormalizationProgress,
  type FormalizationProgressStatus,
} from '../types/formalization';

export function progressStatusFromError(error: unknown): FormalizationProgressStatus {
  return isProgressMissing(error) ? 'missing' : 'error';
}

export function indexProgressByRoute(
  progress: FormalizationProgress[]
): ReadonlyMap<string, FormalizationProgress> {
  return new Map(progress.map((item) => [item.rutaId, item]));
}

export function shouldShowRouteProgress(status: FormalizationProgressStatus): boolean {
  return status === 'loaded';
}
