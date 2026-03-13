import { ScanModel, Scan } from '@/models/scan.model';
import { ScanStatus } from '@/types/scan-status';
import { Types } from 'mongoose';

export class ScanStore {
  async createScan(repositoryUrl: string): Promise<Scan> {
    return ScanModel.create({
      repositoryUrl,
      status: ScanStatus.Queued,
    });
  }

  async getScanById(id: string): Promise<Scan | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    return ScanModel.findById(id);
  }

  async updateScanStatus(
    id: string,
    status: ScanStatus,
    additionalData?: { error?: string; startedAt?: Date; finishedAt?: Date }
  ): Promise<Scan | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    return ScanModel.findByIdAndUpdate(
      id,
      { status, ...additionalData },
      {
        returnDocument: 'after',
      }
    );
  }
}

export const scanStore = new ScanStore();
