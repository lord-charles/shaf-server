import { Injectable } from '@nestjs/common';
const { createCanvas, loadImage, registerFont } = require('canvas');
import * as QRCode from 'qrcode';
import { Delegate, DelegateDocument } from '../delegates/delegates.schema';

@Injectable()
export class BadgeService {
  constructor() {
    // Register custom fonts if needed
    // registerFont('path/to/font.ttf', { family: 'FontName' });
  }

  async generateBadge(delegate: DelegateDocument): Promise<Buffer> {
    const width = 400;
    const height = 250;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#f0f4f8';
    ctx.fillRect(0, 0, width, height);

    // Header
    ctx.fillStyle = '#004a99';
    ctx.fillRect(0, 0, width, 60);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('EVENT BADGE', 20, 40);

    // Delegate Info
    ctx.fillStyle = '#333';
    ctx.font = 'bold 22px Arial';
    ctx.fillText(`${delegate.firstName} ${delegate.lastName}`, 20, 110);

    ctx.font = '16px Arial';
    ctx.fillText(delegate.organization || 'N/A', 20, 140);
    ctx.fillText(delegate.delegateType, 20, 170);

    // QR Code
    const qrCodeData = JSON.stringify({
      delegateId: delegate._id,
      eventYear: delegate.eventYear,
    });
    const qrCodeBuffer = await QRCode.toBuffer(qrCodeData, { width: 120 });
    const qrImage = await loadImage(qrCodeBuffer);
    ctx.drawImage(qrImage, 260, 80, 120, 120);

    // Footer
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.fillText(`Event Year: ${delegate.eventYear}`, 20, 230);

    return canvas.toBuffer('image/png');
  }
}
