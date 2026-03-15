import 'reflect-metadata';
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { createApiContainer } from '@/di/api.container';
import {
  MongodbService,
  MongodbServiceToken,
} from '@/services/mongodb.service';
import {
  ScanQueueService,
  ScanQueueServiceToken,
} from '@/services/scan-queue.service';
import { env } from '@/utils/env.util';
import { logger } from '@/utils/logger.util';
import type { Container, ServiceIdentifier } from 'inversify';
import { buildSchema } from 'type-graphql';
import { HealthResolver } from '@/resolvers/health.resolver';
import { ScanResolver } from '@/resolvers/scan.resolver';

type GraphQLContext = {
  container: Container;
};

let apolloServer: ApolloServer<GraphQLContext> | null = null;
let container: Container | null = null;

const createGraphQLSchema = async (container: Container) => {
  return await buildSchema({
    resolvers: [HealthResolver, ScanResolver],
    container: {
      get: (someClass: new (...args: unknown[]) => object): unknown =>
        container.get(someClass as ServiceIdentifier<object>),
    }, // Pass InversifyJS container for DI
    validate: true, // Enable class-validator validation
    emitSchemaFile: false, // Set to true to generate schema.graphql file
  });
};

const startServer = async (): Promise<void> => {
  try {
    // Create DI container
    container = createApiContainer();

    // Connect to MongoDB
    const mongodbService = container.get<MongodbService>(MongodbServiceToken);
    await mongodbService.connect();

    // Build GraphQL schema
    const schema = await createGraphQLSchema(container);

    // Create Apollo Server with logging plugin
    apolloServer = new ApolloServer<GraphQLContext>({
      schema,
      plugins: [
        {
          // eslint-disable-next-line @typescript-eslint/require-await
          async requestDidStart() {
            return {
              // eslint-disable-next-line @typescript-eslint/require-await
              async didResolveOperation(requestContext) {
                logger.info(
                  {
                    operationName: requestContext.request.operationName,
                    query: requestContext.request.query,
                  },
                  'GraphQL request'
                );
              },
            };
          },
        },
      ],
    });

    // Start standalone server
    const { url } = await startStandaloneServer(apolloServer, {
      listen: { port: env.GRAPHQL_PORT },
      context: () => Promise.resolve({ container: container! }),
    });

    logger.info(`Apollo Server started at ${url}`);
  } catch (error) {
    logger.fatal({ error }, 'Failed to start GraphQL server');
    await cleanup();
    process.exit(1);
  }
};

const cleanup = async (): Promise<void> => {
  logger.info('Shutting down GraphQL server...');

  if (apolloServer) {
    await apolloServer.stop();
  }

  if (container) {
    const scanQueueService = container.get<ScanQueueService>(
      ScanQueueServiceToken
    );
    const mongodbService = container.get<MongodbService>(MongodbServiceToken);
    await scanQueueService.close();
    await mongodbService.disconnect();
  }
};

const shutdown = async (signal: string): Promise<void> => {
  logger.info({ signal }, 'Received shutdown signal');

  try {
    await cleanup();
    logger.info('GraphQL server shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Error during shutdown');
    process.exit(1);
  }
};

// Graceful shutdown handlers
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

process.on('uncaughtException', (error) => {
  logger.fatal({ error }, 'Uncaught exception');
  void shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  logger.fatal({ reason }, 'Unhandled rejection');
  void shutdown('unhandledRejection');
});

// Start server
void startServer();
