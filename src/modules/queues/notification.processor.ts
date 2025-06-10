import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { NotificationService } from '../notifications/services/notification.service';
import { NOTIFICATION_QUEUE } from './constants';

interface NotificationJobData {
  delegateId: string;
  title: string;
  body: string;
}

@Processor(NOTIFICATION_QUEUE)
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private readonly notificationService: NotificationService) {
    super();
  }

  async process(job: Job<NotificationJobData>): Promise<void> {
    this.logger.log(`Processing notification job ${job.id} for delegate ${job.data.delegateId}`);
    const { delegateId, title, body } = job.data;

    try {
      await this.notificationService.sendNotificationToUser(delegateId, title, body);
      this.logger.log(`Successfully sent push notification for job ${job.id}`);
    } catch (error) {
      this.logger.error(`Failed to process notification job ${job.id}: ${error.message}`, error.stack);
      // Re-throw the error to let BullMQ handle the job failure (e.g., retry)
      throw error;
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} has completed.`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this.logger.error(`Job ${job.id} has failed with error: ${err.message}`, err.stack);
  }
}
