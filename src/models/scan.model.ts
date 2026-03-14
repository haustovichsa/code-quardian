import { prop, getModelForClass, modelOptions } from '@typegoose/typegoose';
import { ScanStatus } from '@/types/scan-status';

export class Vulnerability {
  @prop({ type: String })
  public Title?: string;

  @prop({ type: String })
  public Description?: string;

  @prop({ type: String })
  public Severity?: string;

  @prop({ type: String })
  public VulnerabilityID?: string;

  @prop({ type: String })
  public PkgName?: string;

  @prop({ type: String })
  public InstalledVersion?: string;

  @prop({ type: String })
  public FixedVersion?: string;
}

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

  @prop({ type: () => [Vulnerability], default: [] })
  public vulnerabilities!: Vulnerability[];

  _id!: string;
  public createdAt!: Date;
  public updatedAt!: Date;
}

export const ScanModel = getModelForClass(Scan);
