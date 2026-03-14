import { Container } from 'inversify';
import {
  MongodbService,
  MongodbServiceToken,
} from '@/services/mongodb.service';
import {
  ScanWorkerService,
  ScanWorkerServiceToken,
} from '@/services/scan-worker.service';
import {
  ScannerService,
  ScannerServiceToken,
} from '@/services/scanner.service';
import {
  TrivyToolService,
  TrivyToolServiceToken,
} from '@/services/trivy-tool.service';
import {
  VulnerabilityJsonParserService,
  VulnerabilityJsonParserServiceToken,
} from '@/services/vulnerability-json-parser.service';
import { ScanStore, ScanStoreToken } from '@/stores/scan.store';

export const createWorkerContainer = (): Container => {
  const container = new Container();

  // Bind services
  container
    .bind<MongodbService>(MongodbServiceToken)
    .to(MongodbService)
    .inSingletonScope();

  container
    .bind<ScanWorkerService>(ScanWorkerServiceToken)
    .to(ScanWorkerService)
    .inSingletonScope();

  container
    .bind<ScannerService>(ScannerServiceToken)
    .to(ScannerService)
    .inSingletonScope();

  container
    .bind<TrivyToolService>(TrivyToolServiceToken)
    .to(TrivyToolService)
    .inSingletonScope();

  container
    .bind<VulnerabilityJsonParserService>(VulnerabilityJsonParserServiceToken)
    .to(VulnerabilityJsonParserService)
    .inSingletonScope();

  container.bind<ScanStore>(ScanStoreToken).to(ScanStore).inSingletonScope();

  return container;
};
