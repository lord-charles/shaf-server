import { Injectable, Logger } from '@nestjs/common';
import {
  createCanvas,
  loadImage,
  registerFont,
  CanvasRenderingContext2D,
  Canvas,
} from 'canvas';
import * as QRCode from 'qrcode';
import { DelegateDocument } from '../delegates/delegates.schema';

try {
  registerFont('./fonts/Poppins-Regular.ttf', {
    family: 'Poppins',
    weight: 'normal',
  });
  registerFont('./fonts/Poppins-Bold.ttf', {
    family: 'Poppins',
    weight: 'bold',
  });
  registerFont('./fonts/Poppins-SemiBold.ttf', {
    family: 'Poppins',
    weight: '600',
  });
} catch (error) {
  Logger.warn('Could not register custom fonts. Falling back to system fonts.');
}

@Injectable()
export class BadgeService {
  private readonly logger = new Logger(BadgeService.name);

  // Helper function to draw rounded rectangles, useful for modern UI elements
  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
  ) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    return ctx;
  }

  // Main method to generate the badge
  async generateBadge(delegate: DelegateDocument): Promise<Buffer> {
    const width = 1020; // Increased resolution for better quality
    const height = 638; // Proportional to a standard card (approx 3.37" x 2.125")
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Define a modern font family
    const fontFamily = 'Segoe UI, Roboto, Arial, sans-serif';

    // Set a light, clean background
    ctx.fillStyle = '#F7F9FC';
    ctx.fillRect(0, 0, width, height);

    // Draw Header
    this.drawHeader(
      ctx,
      width,
      height,
      fontFamily,
      delegate.eventYear,
      delegate.delegateType,
    );

    // Draw Profile Picture / Initials
    await this.drawProfilePicture(ctx, delegate, 140, 300, 90);

    // Draw Delegate Info
    this.drawDelegateInfo(ctx, fontFamily, delegate);

    // Draw QR Code Section
    await this.drawQRCode(ctx, fontFamily, delegate, width);

    // Draw Footer
    this.drawFooter(ctx, width, height, fontFamily, delegate);

    return canvas.toBuffer('image/png');
  }

  private drawHeader(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    fontFamily: string,
    eventYear: number,
    delegateType: string,
  ) {
    // Create a blue to green gradient for the header
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, '#0D47A1'); // Dark Blue
    gradient.addColorStop(0.7, '#1565C0'); // Lighter Blue
    gradient.addColorStop(1, '#26A69A'); // Teal/Green

    ctx.fillStyle = gradient;
    this.roundRect(ctx, 0, 0, width, height * 0.22, 0).fill(); // Header height is 22% of total height

    // Draw "SHELTER AFRIQUE" Logo Placeholder & Text
    // A real logo image would be loaded here. For now, we create a placeholder.
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(90, 70, 40, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#26A69A';
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.fillStyle = 'white';
    ctx.font = `bold 42px ${fontFamily}`;
    ctx.fillText('SHELTER AFRIQUE', 160, 65);
    ctx.font = `30px ${fontFamily}`;
    ctx.fillText(`Annual AGM ${eventYear}`, 162, 110);

    // Draw "OFFICIAL DELEGATE" on the right
    ctx.textAlign = 'right';
    ctx.font = `bold 32px ${fontFamily}`;
    ctx.fillText('OFFICIAL', width - 60, 65);
    ctx.font = `30px ${fontFamily}`;
    ctx.fillText(delegateType.toUpperCase(), width - 60, 110);
    ctx.textAlign = 'left'; // Reset alignment
  }

  private async drawProfilePicture(
    ctx: CanvasRenderingContext2D,
    delegate: DelegateDocument,
    x: number,
    y: number,
    radius: number,
  ) {
    ctx.save();
    // Create a circular clipping path
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();

    try {
      // Attempt to load profile picture
      const profilePic = await loadImage(delegate.profilePicture);
      ctx.drawImage(profilePic, x - radius, y - radius, radius * 2, radius * 2);
    } catch (error) {
      this.logger.warn(
        `Could not load profile picture for ${delegate.email}. Falling back to initials.`,
      );
      // Fallback to initials
      const initials =
        `${delegate.firstName[0] || ''}${delegate.lastName[0] || ''}`.toUpperCase();
      ctx.fillStyle = '#E0E0E0'; // Grey background for initials
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);

      ctx.fillStyle = '#333333';
      ctx.font = `bold ${radius}px 'Segoe UI', 'Roboto', 'Arial', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(initials, x, y);
      ctx.textAlign = 'left'; // Reset alignment
      ctx.textBaseline = 'alphabetic'; // Reset baseline
    }
    ctx.restore(); // Restore context to remove clipping path
  }

  private drawDelegateInfo(
    ctx: CanvasRenderingContext2D,
    fontFamily: string,
    delegate: DelegateDocument,
  ) {
    ctx.fillStyle = '#1A237E'; // Dark blue for name
    ctx.font = `bold 60px ${fontFamily}`;
    const delegateName = `${delegate.firstName} ${delegate.lastName}`;
    ctx.fillText(delegateName, 70, 450);

    // Decorative line under the name
    ctx.fillStyle = '#29B6F6'; // Light Blue
    ctx.fillRect(70, 470, 150, 8);
    ctx.fillStyle = '#26A69A'; // Teal
    ctx.fillRect(220, 470, 60, 8);

    // Position and Organization
    ctx.fillStyle = '#333333';
    ctx.font = `36px ${fontFamily}`;
    ctx.fillText(delegate.position || 'N/A', 70, 525);
    ctx.font = `32px ${fontFamily}`;
    ctx.fillStyle = '#555555';
    ctx.fillText(delegate.organization || 'N/A', 70, 570);
  }

  private async drawQRCode(
    ctx: CanvasRenderingContext2D,
    fontFamily: string,
    delegate: DelegateDocument,
    width: number,
  ) {
    const qrCodeData = JSON.stringify({
      delegateId: delegate._id,
      name: `${delegate.firstName} ${delegate.lastName}`,
      eventYear: delegate.eventYear,
    });

    const qrSize = 240;
    const qrX = width - qrSize - 80;
    const qrY = 250;

    // Draw a rounded rectangle background for the QR code
    ctx.fillStyle = 'white';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 5;
    this.roundRect(
      ctx,
      qrX - 20,
      qrY - 20,
      qrSize + 40,
      qrSize + 100,
      20,
    ).fill();
    ctx.shadowColor = 'transparent'; // Reset shadow

    // Generate and draw QR code
    try {
      const qrCodeBuffer = await QRCode.toBuffer(qrCodeData, {
        errorCorrectionLevel: 'H',
        margin: 2,
        scale: 8,
        color: {
          dark: '#0D47A1', // Dark blue dots
          light: '#FFFFFF00', // Transparent background
        },
      });
      const qrImage = await loadImage(qrCodeBuffer);
      ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
    } catch (err) {
      this.logger.error('Failed to generate QR code', err);
      ctx.fillStyle = 'red';
      ctx.fillText('QR Error', qrX + 60, qrY + 120);
    }

    // Add "Scan for verification" text
    ctx.fillStyle = '#555';
    ctx.font = `24px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.fillText('Scan for verification', qrX + qrSize / 2, qrY + qrSize + 50);
    ctx.textAlign = 'left'; // Reset alignment
  }

  private drawFooter(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    fontFamily: string,
    delegate: DelegateDocument,
  ) {
    ctx.fillStyle = '#ECEFF1'; // Light grey footer background
    ctx.fillRect(0, height - 50, width, 50);

    ctx.fillStyle = '#546E7A';
    ctx.font = `22px ${fontFamily}`;
    ctx.textBaseline = 'middle';

    // Event ID
    const eventId = `Event ID: ${delegate._id.toString().slice(-8)}`;
    ctx.fillText(eventId, 40, height - 25);

    // Year
    ctx.textAlign = 'center';
    ctx.fillText(`Year: ${delegate.eventYear}`, width / 2, height - 25);
    ctx.textAlign = 'left';

    // Website
    ctx.textAlign = 'right';
    ctx.fillText('shelterafrique.org', width - 40, height - 25);
    ctx.textAlign = 'left'; // Reset
  }
}
