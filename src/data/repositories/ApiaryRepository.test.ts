import { IDS } from '../../test-utils/domain-fixtures';
import { describeSyncedRepository, setupRepository } from '../../test-utils/repository-contract';

import { createApiaryRepository } from './ApiaryRepository';

describeSyncedRepository({
  tableName: 'apiaries',
  create: createApiaryRepository,
  sample: {
    id: IDS.record,
    businessId: IDS.business,
    name: 'Yayla',
    climateProfileCode: null,
    latitude: 40.1,
    longitude: 32.5,
    locationSource: 'gps' as const,
    notes: null,
  },
  changes: { name: 'Yayla 2', notes: 'Kuzey yamacı' },
});

describe('ApiaryRepository', () => {
  const apiary = (id: string, businessId: string, name: string) => ({
    id,
    businessId,
    name,
    climateProfileCode: null,
    latitude: null,
    longitude: null,
    locationSource: null,
    notes: null,
  });

  it('işletmenin arılıklarını ada göre listeler, diğer işletmeleri karıştırmaz', () => {
    const { repo } = setupRepository({ create: createApiaryRepository });
    repo.create(apiary(IDS.apiary, IDS.business, 'Ova'));
    repo.create(apiary(IDS.apiary2, IDS.business, 'Dağ'));
    repo.create(apiary(IDS.record, IDS.user, 'Başka işletme'));

    expect(repo.listByBusiness(IDS.business).map((a) => a.name)).toEqual(['Dağ', 'Ova']);
  });

  it('konumu ondalık sayı olarak korur', () => {
    const { repo } = setupRepository({ create: createApiaryRepository });
    const created = repo.create({
      ...apiary(IDS.apiary, IDS.business, 'Ova'),
      latitude: 39.92077,
      longitude: 32.85411,
      locationSource: 'manual',
    });

    expect(repo.getById(IDS.apiary)).toEqual(created);
  });
});
