import { injectable } from 'inversify';
import { ScanModel, Scan, Vulnerability } from '@/models/scan.model';
import { ScanStatus } from '@/types/scan-status';
import { Types } from 'mongoose';

export const ScanStoreToken = Symbol.for('ScanStore');

@injectable()
export class ScanStore {
  async createScan(repositoryUrl: string): Promise<Scan> {
    const scan = await ScanModel.create({
      repositoryUrl,
      status: ScanStatus.Queued,
    });
    return scan.toObject();
  }

  async getScanById(id: string): Promise<Scan | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    const scan = await ScanModel.findById(id);
    return scan ? scan.toObject() : null;
  }

  async updateScanStatus(
    id: string,
    status: ScanStatus,
    additionalData?: {
      error?: string;
      startedAt?: Date;
      finishedAt?: Date;
      vulnerabilities?: Vulnerability[];
    }
  ): Promise<Scan | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    const scan = await ScanModel.findByIdAndUpdate(
      id,
      { status, ...additionalData },
      {
        returnDocument: 'after',
      }
    );
    return scan ? scan.toObject() : null;
  }
}
