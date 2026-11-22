import type { ApiaryRepository } from '../../../data/repositories/ApiaryRepository';
import type { BusinessRepository } from '../../../data/repositories/BusinessRepository';
import type { Apiary, Business } from '../../../domain/entities';
import { reportError } from '../../../lib/observability/report';

// İlk açılış (onboarding) iş mantığı (TODO.md T1.8): işletme adı → ilk arılık → bildirim izni.
// İlerleme ayrıca saklanmaz, verinin kendisinden çıkarılır: işletme var mı, arılık var mı,
// bildirim adımı yanıtlandı mı. Böylece akış yarıda kalırsa (ya da başka telefonda giriş
// yapılırsa) kaldığı adımdan devam eder.

export const ONBOARDING_STEPS = ['business-name', 'first-apiary', 'notifications'] as const;
export type OnboardingStepName = (typeof ONBOARDING_STEPS)[number];
/** `loading`: veri ya da ilk senkron henüz gelmedi; karar verilemiyor. */
export type OnboardingStep = OnboardingStepName | 'done' | 'loading';

export const NAME_MAX_LENGTH = 100;

export type OnboardingErrorKind = 'name_required' | 'name_too_long' | 'unknown';

export class OnboardingError extends Error {
  constructor(readonly kind: OnboardingErrorKind) {
    super(`Onboarding hatası: ${kind}`);
    this.name = 'OnboardingError';
  }
}

export interface StepInput {
  /** Veri yerelden okundu mu (canlı sorguların ilk sonucu geldi mi)? */
  loaded: boolean;
  /** İlk senkron bitti ya da yapılamıyor (çevrimdışı vb.): sunucudaki işletme yerele inmiş olabilir. */
  syncReady: boolean;
  hasBusiness: boolean;
  hasApiary: boolean;
  /** Bildirim adımı yanıtlandı mı; henüz okunmadıysa `null`. */
  notificationsAnswered: boolean | null;
}

/** Hangi adımda olunduğu. Başka telefonda açılan hesap için işletme ilk senkronda iner; beklenir. */
export function resolveOnboardingStep(input: StepInput): OnboardingStep {
  if (!input.loaded || input.notificationsAnswered === null) return 'loading';
  if (!input.hasBusiness) return input.syncReady ? 'business-name' : 'loading';
  if (!input.hasApiary) return 'first-apiary';
  if (!input.notificationsAnswered) return 'notifications';
  return 'done';
}

/** Senkron durumundan: ilk senkron bitti mi ya da beklemek anlamsız mı? */
export function isSyncReady(snapshot: { status: string; lastSyncedAt: string | null }): boolean {
  if (snapshot.lastSyncedAt !== null) return true;
  return ['offline', 'error', 'signedOut', 'updateRequired'].includes(snapshot.status);
}

/** İşletme ve arılık adı: boşluklar kırpılır; boş ya da 100 karakterden uzun olamaz. */
export function validateName(input: string): string {
  const name = input.trim();
  if (name.length === 0) throw new OnboardingError('name_required');
  if (name.length > NAME_MAX_LENGTH) throw new OnboardingError('name_too_long');
  return name;
}

export interface OnboardingServiceDeps {
  businesses: Pick<BusinessRepository, 'create' | 'watchByOwner'>;
  apiaries: Pick<ApiaryRepository, 'create' | 'watchByBusiness'>;
  createId: () => string;
  /** Küçük cihaz ayarları (bildirim adımının yanıtlandığı). */
  flags: {
    getItemAsync(key: string): Promise<string | null>;
    setItemAsync(key: string, value: string): Promise<void>;
  };
  /** Bildirim izni (expo-notifications). */
  notifications: { requestPermissionsAsync(): Promise<{ granted: boolean }> };
}

export const NOTIFICATIONS_ANSWERED_KEY = 'onboarding.notificationsAnswered';

export function createOnboardingService(deps: OnboardingServiceDeps) {
  const markNotificationsAnswered = () => deps.flags.setItemAsync(NOTIFICATIONS_ANSWERED_KEY, '1');

  return {
    watchBusinesses: (ownerId: string) => deps.businesses.watchByOwner(ownerId),
    watchApiaries: (businessId: string) => deps.apiaries.watchByBusiness(businessId),

    createBusiness(ownerId: string, nameInput: string): Business {
      const name = validateName(nameInput);
      return deps.businesses.create({ id: deps.createId(), ownerId, name });
    },

    /** İlk arılık yalnızca adla açılır; konum ve iklim bölgesi arılık ekranında eklenir (T2.1–T2.2). */
    createFirstApiary(businessId: string, nameInput: string): Apiary {
      const name = validateName(nameInput);
      return deps.apiaries.create({
        id: deps.createId(),
        businessId,
        name,
        climateProfileCode: null,
        latitude: null,
        longitude: null,
        locationSource: null,
        notes: null,
      });
    },

    async isNotificationsAnswered(): Promise<boolean> {
      try {
        return (await deps.flags.getItemAsync(NOTIFICATIONS_ANSWERED_KEY)) === '1';
      } catch {
        return false;
      }
    },

    /** İzin ister; kullanıcı ne derse desin adım tamamlanır (izin ayarlardan sonra da verilebilir). */
    async requestNotifications(): Promise<boolean> {
      let granted = false;
      try {
        granted = (await deps.notifications.requestPermissionsAsync()).granted;
      } catch (error) {
        reportError(error, {
          layer: 'service',
          feature: 'onboarding',
          operation: 'requestNotifications',
        });
      }
      await markNotificationsAnswered();
      return granted;
    },

    async skipNotifications(): Promise<void> {
      await markNotificationsAnswered();
    },
  };
}

export type OnboardingService = ReturnType<typeof createOnboardingService>;
