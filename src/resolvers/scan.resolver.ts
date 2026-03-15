import { injectable, inject } from 'inversify';
import {
  Resolver,
  Query,
  Mutation,
  Arg,
  ID,
  InputType,
  Field,
  registerEnumType,
  FieldResolver,
  Root,
} from 'type-graphql';
import { ScanStore, ScanStoreToken } from '@/stores/scan.store';
import {
  ScanQueueService,
  ScanQueueServiceToken,
} from '@/services/scan-queue.service';
import { logger } from '@/utils/logger.util';
import { GraphQLError } from 'graphql';
import { IsUrl, Matches } from 'class-validator';
import { ScanStatus } from '@/types/scan-status';
import { Scan } from '@/models/scan.model';

registerEnumType(ScanStatus, {
  name: 'ScanStatus',
  description: 'The status of a security scan',
});

@InputType({ description: 'Input for creating a new scan' })
class CreateScanInput {
  @Field(() => String)
  @IsUrl({
    protocols: ['https'],
    require_protocol: true,
  })
  @Matches(
    /^https:\/\/github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+(\.git)?\/?$/,
    {
      message:
        'Must be a valid GitHub repository URL (https://github.com/owner/repo)',
    }
  )
  repositoryUrl!: string;
}

@injectable()
@Resolver(() => Scan)
export class ScanResolver {
  constructor(
    @inject(ScanStoreToken) private readonly scanStore: ScanStore,
    @inject(ScanQueueServiceToken)
    private readonly scanQueueService: ScanQueueService
  ) {}

  @FieldResolver(() => ID)
  id(@Root() scan: Scan): string {
    if (!scan._id) {
      throw new GraphQLError('Scan document missing _id field', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      });
    }

    return scan._id.toString();
  }

  @Query(() => Scan, {
    nullable: true,
    description: 'Get scan by ID with status and vulnerabilities',
  })
  async scan(@Arg('id', () => ID) id: string): Promise<Scan | null> {
    try {
      const scan = await this.scanStore.getScanById(id);

      if (!scan) {
        throw new GraphQLError('Scan not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      return scan;
    } catch (error) {
      logger.error({ error, scanId: id }, 'Error getting scan');
      if (error instanceof GraphQLError) {
        throw error;
      }
      throw new GraphQLError('Failed to retrieve scan', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      });
    }
  }

  @Mutation(() => Scan, {
    description: 'Create a new security scan for a GitHub repository',
  })
  async createScan(
    @Arg('input', () => CreateScanInput) input: CreateScanInput
  ): Promise<Scan> {
    try {
      const scan = await this.scanStore.createScan(input.repositoryUrl);

      await this.scanQueueService.addScanJobToQueue({
        scanId: scan._id.toString(),
        repositoryUrl: input.repositoryUrl,
      });

      logger.info({ scan }, 'Scan created via GraphQL');

      return scan;
    } catch (error) {
      logger.error({ error }, 'Error creating scan via GraphQL');
      throw new GraphQLError('Failed to create scan', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      });
    }
  }
}
