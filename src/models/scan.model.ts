import { prop, getModelForClass, modelOptions } from '@typegoose/typegoose';
import { ScanStatus } from '@/types/scan-status';

@modelOptions({
  schemaOptions: {
    timestamps: true,
    collection: 'scans',
  },
})
export class Scan {
  @prop({ required: true, type: String })
  public repositoryUrl!: string;

  @prop({
    required: true,
    enum: ScanStatus,
    default: ScanStatus.Queued,
    type: String,
  })
  public status!: ScanStatus;

  @prop({ type: String })
  public error?: string;

  @prop({ type: Date })
  public startedAt?: Date;

  @prop({ type: Date })
  public finishedAt?: Date;

  public createdAt!: Date;
  public updatedAt!: Date;
}

export const ScanModel = getModelForClass(Scan);
