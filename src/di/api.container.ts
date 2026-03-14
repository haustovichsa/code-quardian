import { Container } from 'inversify';
import {
  MongodbService,
  MongodbServiceToken,
} from '@/services/mongodb.service';
import {
  ScanQueueService,
  ScanQueueServiceToken,
} from '@/services/scan-queue.service';
import { ScanStore, ScanStoreToken } from '@/stores/scan.store';

export const createApiContainer = (): Container => {
  const container = new Container();

  // Bind services
  container
    .bind<MongodbService>(MongodbServiceToken)
    .to(MongodbService)
    .inSingletonScope();

  container
    .bind<ScanQueueService>(ScanQueueServiceToken)
    .to(ScanQueueService)
    .inSingletonScope();

  container.bind<ScanStore>(ScanStoreToken).to(ScanStore).inSingletonScope();

  return container;
};
