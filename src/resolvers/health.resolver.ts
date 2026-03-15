import { injectable } from 'inversify';
import { Resolver, Query, ObjectType, Field } from 'type-graphql';
import mongoose from 'mongoose';

@ObjectType()
class MongoDbStatus {
  @Field(() => String)
  status!: string;
}

@ObjectType({ description: 'Health check response' })
export class HealthType {
  @Field(() => String)
  status!: string;

  @Field(() => MongoDbStatus)
  mongoDb!: MongoDbStatus;

  @Field(() => String)
  timestamp!: string;
}

@injectable()
@Resolver()
export class HealthResolver {
  @Query(() => HealthType, { description: 'Check service health status' })
  health(): HealthType {
    const dbStatus: number = mongoose.connection.readyState;
    const dbStatusMap: Record<number, string> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    return {
      status: 'ok',
      mongoDb: {
        status: dbStatusMap[dbStatus] ?? 'unknown',
      },
      timestamp: new Date().toISOString(),
    };
  }
}
