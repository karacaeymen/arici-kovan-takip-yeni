import { IDS } from '../../test-utils/domain-fixtures';
import { describeSyncedRepository, setupRepository } from '../../test-utils/repository-contract';

import { createBusinessRepository } from './BusinessRepository';

describeSyncedRepository({
  tableName: 'businesses',
  create: createBusinessRepository,
  sample: { id: IDS.business, ownerId: IDS.user, name: 'Karaca Arıcılık' },
  changes: { name: 'Karaca Bal' },
});

describe('BusinessRepository', () => {
  it('kullanıcının silinmemiş işletmelerini ada göre listeler', async () => {
    const { repo } = setupRepository({ create: createBusinessRepository });
    repo.create({ id: IDS.business, ownerId: IDS.user, name: 'Zeytin Arıcılık' });
    repo.create({ id: IDS.record, ownerId: IDS.user, name: 'Arı Evi' });
    repo.create({ id: IDS.apiary, ownerId: IDS.business, name: 'Başkasının' });
    repo.create({ id: IDS.hive, ownerId: IDS.user, name: 'Silinen' });
    repo.remove(IDS.hive);

    expect(repo.listByOwner(IDS.user).map((b) => b.name)).toEqual(['Arı Evi', 'Zeytin Arıcılık']);
    expect(await repo.watchByOwner(IDS.user)).toHaveLength(2);
  });
});
