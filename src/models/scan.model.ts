import { prop, getModelForClass, modelOptions } from '@typegoose/typegoose';
import { Field, ObjectType, ID } from 'type-graphql';
import { ScanStatus } from '@/types/scan-status';
import { Types } from 'mongoose';

@ObjectType({ description: 'A security vulnerability found in the scan' })
export class Vulnerability {
  @Field(() => String, { nullable: true })
  @prop({ type: String })
  public Title?: string;

  @Field(() => String, { nullable: true })
  @prop({ type: String })
  public Description?: string;

  @Field(() => String, { nullable: true })
  @prop({ type: String })
  public Severity?: string;

  @Field(() => String, { nullable: true })
  @prop({ type: String })
  public VulnerabilityID?: string;

  @Field(() => String, { nullable: true })
  @prop({ type: String })
  public PkgName?: string;

  @Field(() => String, { nullable: true })
  @prop({ type: String })
  public InstalledVersion?: string;

  @Field(() => String, { nullable: true })
  @prop({ type: String })
  public FixedVersion?: string;
}

@ObjectType({ description: 'A repository security scan' })
@modelOptions({
  schemaOptions: {
    timestamps: true,
    collection: 'scans',
  },
})
export class Scan {
  @Field(() => ID, { description: 'Unique identifier for the scan' })
  _id!: Types.ObjectId | string;

  @Field(() => String)
  @prop({ required: true, type: String })
  public repositoryUrl!: string;

  @Field(() => ScanStatus)
  @prop({
    required: true,
    enum: ScanStatus,
    default: ScanStatus.Queued,
    type: String,
  })
  public status!: ScanStatus;

  @Field(() => String, { nullable: true })
  @prop({ type: String })
  public error?: string;

  @Field(() => Date, { nullable: true })
  @prop({ type: Date })
  public startedAt?: Date;

  @Field(() => Date, { nullable: true })
  @prop({ type: Date })
  public finishedAt?: Date;

  @Field(() => [Vulnerability])
  @prop({ type: () => [Vulnerability], default: [] })
  public vulnerabilities!: Vulnerability[];

  @Field(() => Date)
  public createdAt!: Date;

  @Field(() => Date)
  public updatedAt!: Date;
}

export const ScanModel = getModelForClass(Scan);
