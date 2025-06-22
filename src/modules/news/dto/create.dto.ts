import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
  IsDate,
  MaxLength,
  ValidateNested,
  IsUrl,
  IsEmail,
  IsISO8601,
  ArrayMinSize,
  MinLength,
} from 'class-validator';
import { NewsCategory, NewsPriority, NewsStatus } from '../schema';

// DTOs for embedded documents
export class CreateMediaAttachmentDto {
  @ApiProperty({
    description: 'URL of the media file',
    example: 'https://shelterafrique.org/media/images/housing-project-2024.jpg',
  })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  url: string;

  @ApiProperty({
    description: 'Type of media attachment',
    enum: ['image', 'video', 'document', 'audio'],
    example: 'image',
  })
  @IsString()
  @IsNotEmpty()
  @IsEnum(['image', 'video', 'document', 'audio'])
  type: string;

  @ApiPropertyOptional({
    description: 'Caption for the media attachment',
    maxLength: 200,
    example:
      'Affordable housing project in Nairobi completed in partnership with local developers',
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  caption?: string;

  @ApiPropertyOptional({
    description: 'Alternative text for accessibility',
    maxLength: 100,
    example: 'Modern residential buildings with solar panels in Nairobi suburb',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  altText?: string;

  @ApiPropertyOptional({
    description: 'File size in bytes',
    example: 2048576,
  })
  @IsOptional()
  size?: number;

  @ApiPropertyOptional({
    description: 'MIME type of the file',
    example: 'image/jpeg',
  })
  @IsString()
  @IsOptional()
  mimeType?: string;
}

export class CreateAuthorDto {
  @ApiProperty({
    description: 'Full name of the author',
    example: 'Dr. Kingsley Mulingwa',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional({
    description: 'Email address of the author',
    example: 'k.mulingwa@shelterafrique.org',
  })
  @IsString()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Professional title of the author',
    example: 'Chief Executive Officer',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    description: 'Brief biography of the author',
    example:
      'Dr. Mulingwa is the CEO of ShelterAfrique with over 20 years of experience in affordable housing development across Africa.',
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({
    description: "URL to author's profile picture",
    example: 'https://shelterafrique.org/team/dr-kingsley-mulingwa.jpg',
  })
  @IsString()
  @IsOptional()
  @IsUrl()
  avatar?: string;
}

export class CreateTranslationDto {
  @ApiProperty({
    description: 'Language code (ISO 639-1)',
    example: 'fr',
  })
  @IsString()
  @IsNotEmpty()
  language: string;

  @ApiProperty({
    description: 'Translated title',
    example:
      'ShelterAfrique lance un nouveau programme de logements abordables au Kenya',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({
    description: 'Translated content',
    example:
      "ShelterAfrique, la principale institution de financement du logement en Afrique, a annoncé aujourd'hui le lancement d'un nouveau programme...",
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    description: 'Translated excerpt',
    example:
      'Un nouveau programme visant à construire 5 000 unités de logements abordables au Kenya sur les trois prochaines années.',
  })
  @IsString()
  @IsOptional()
  @MaxLength(300)
  excerpt?: string;
}

export class CreateNewsDto {
  @ApiProperty({
    description: 'News article title',
    maxLength: 200,
    example: 'ShelterAfrique Launches New Affordable Housing Program in Kenya',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @MinLength(10)
  title: string;

  @ApiProperty({
    description: 'Main content of the news article',
    example:
      "ShelterAfrique, Africa's premier housing development finance institution, today announced the launch of a comprehensive new affordable housing program in Kenya. The initiative aims to construct 5,000 affordable housing units over the next three years, targeting middle and low-income families across major urban centers including Nairobi, Mombasa, and Kisumu.\n\nThe program, valued at USD 250 million, represents a significant milestone in ShelterAfrique's commitment to addressing the continent's housing deficit. \"This program aligns perfectly with Kenya's Big Four Agenda and demonstrates our continued dedication to making homeownership accessible to ordinary Africans,\" said Dr. Kingsley Mulingwa, CEO of ShelterAfrique.\n\nThe housing units will feature modern amenities including solar water heating systems, rainwater harvesting infrastructure, and energy-efficient designs that reduce utility costs for residents. Construction is expected to begin in Q2 2025, with the first phase delivering 1,500 units by December 2025.",
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(50)
  content: string;

  @ApiPropertyOptional({
    description: 'Brief excerpt or summary of the article',
    maxLength: 300,
    example:
      'New program aims to build 5,000 affordable housing units in Kenya over the next three years, targeting middle and low-income families.',
  })
  @IsString()
  @IsOptional()
  @MaxLength(300)
  excerpt?: string;

  @ApiPropertyOptional({
    description:
      'URL-friendly slug for the article. If not provided, will be auto-generated from title',
    example: 'shelterafrique-launches-affordable-housing-kenya-2024',
  })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({
    description: 'Publication status of the news article',
    enum: NewsStatus,
    default: NewsStatus.DRAFT,
    example: NewsStatus.PUBLISHED,
  })
  @IsEnum(NewsStatus)
  @IsOptional()
  status?: NewsStatus;

  @ApiPropertyOptional({
    description: 'Whether this article should be featured prominently',
    default: false,
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  featured?: boolean;

  @ApiPropertyOptional({
    description: 'Whether this article should be pinned to the top',
    default: false,
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  pinned?: boolean;

  @ApiProperty({
    description: 'News category',
    enum: NewsCategory,
    example: NewsCategory.HOUSING,
  })
  @IsEnum(NewsCategory)
  category: NewsCategory;

  @ApiPropertyOptional({
    description: 'Tags for categorization and search',
    type: [String],
    example: [
      'affordable housing',
      'Kenya',
      'urban development',
      'finance',
      'Big Four Agenda',
    ],
  })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Priority level of the news',
    enum: NewsPriority,
    default: NewsPriority.MEDIUM,
    example: NewsPriority.HIGH,
  })
  @IsEnum(NewsPriority)
  @IsOptional()
  priority?: NewsPriority;

  @ApiPropertyOptional({
    description: 'When the article should be published (for scheduling)',
    example: '2024-12-25T10:00:00.000Z',
  })
  @IsOptional()
  @Type(() => Date)
  publishedAt?: Date;

  @ApiPropertyOptional({
    description: 'Scheduled publication date/time',
    example: '2024-12-25T08:00:00.000Z',
  })
  @IsOptional()
  @Type(() => Date)
  scheduledAt?: Date;

  @ApiProperty({
    description: 'Author information',
    type: CreateAuthorDto,
  })
  @ValidateNested()
  @Type(() => CreateAuthorDto)
  author: CreateAuthorDto;

  @ApiPropertyOptional({
    description: 'URL of the featured image',
    example:
      'https://shelterafrique.org/media/featured/kenya-housing-program-2024.jpg',
  })
  @IsString()
  @IsOptional()
  @IsUrl()
  featuredImage?: string;

  @ApiPropertyOptional({
    description: 'Media attachments (images, videos, documents)',
    type: [CreateMediaAttachmentDto],
    example: [
      {
        url: 'https://shelterafrique.org/media/images/housing-project-2024.jpg',
        type: 'image',
        caption: 'Affordable housing project in Nairobi',
        altText: 'Modern residential buildings with solar panels',
      },
      {
        url: 'https://shelterafrique.org/media/documents/program-details.pdf',
        type: 'document',
        caption: 'Detailed program documentation',
      },
    ],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateMediaAttachmentDto)
  attachments?: CreateMediaAttachmentDto[];

  @ApiPropertyOptional({
    description: 'Translations in different languages',
    type: [CreateTranslationDto],
    example: [
      {
        language: 'fr',
        title:
          'ShelterAfrique lance un nouveau programme de logements abordables au Kenya',
        content:
          'ShelterAfrique, la principale institution de financement du logement en Afrique...',
        excerpt:
          'Un nouveau programme visant à construire 5 000 unités de logements abordables au Kenya.',
      },
      {
        language: 'sw',
        title:
          'ShelterAfrique inazindua mpango mpya wa nyumba za bei nafuu nchini Kenya',
        content:
          'ShelterAfrique, taasisi kuu ya uongozi wa fedha za maendeleo ya nyumba barani Afrika...',
        excerpt:
          'Mpango mpya unalenga kujenga nyumba 5,000 za bei nafuu nchini Kenya.',
      },
    ],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateTranslationDto)
  translations?: CreateTranslationDto[];

  @ApiPropertyOptional({
    description: 'Array of related news article IDs',
    type: [String],
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
  })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  relatedNews?: string[];

  @ApiPropertyOptional({
    description: 'External links related to the news',
    type: [String],
    example: [
      'https://www.government.ke/big-four-agenda/',
      'https://www.unhabitat.org/affordable-housing-africa',
    ],
  })
  @IsArray()
  @IsOptional()
  @IsUrl({}, { each: true })
  externalLinks?: string[];
}

export class UpdateNewsDto extends PartialType(CreateNewsDto) {}
// Swagger examples for different use cases
export const SwaggerExamples = {
  createPressRelease: {
    summary: 'Press Release Example',
    description: 'Example of creating a press release for ShelterAfrique',
    value: {
      title:
        'ShelterAfrique Announces Partnership with African Development Bank for $500M Housing Initiative',
      content:
        'ShelterAfrique has entered into a strategic partnership with the African Development Bank (AfDB) to launch a groundbreaking $500 million housing initiative across 15 African countries. This landmark agreement was signed during the Annual Meetings of the AfDB in Abidjan, Côte d\'Ivoire, marking the largest single commitment to affordable housing financing in the continent\'s history.\n\nThe initiative, dubbed "Africa Housing Accelerator Program," will focus on delivering sustainable, climate-resilient housing solutions to underserved communities. The program targets the construction of 25,000 housing units over five years, directly benefiting over 125,000 individuals across participating countries including Nigeria, Ghana, Rwanda, Tanzania, and Senegal.\n\n"This partnership represents a paradigm shift in how we approach housing finance in Africa," said Dr. Kingsley Mulingwa, CEO of ShelterAfrique. "By combining our deep understanding of local markets with AfDB\'s continental reach and financial strength, we are creating a sustainable model for affordable housing delivery that can be replicated across the continent."',
      excerpt:
        'Strategic partnership with AfDB to launch $500M housing initiative targeting 25,000 housing units across 15 African countries over five years.',
      slug: 'shelterafrique-partners-with-afdb-for-500m-housing-initiative',
      category: NewsCategory.PRESS_RELEASE,
      status: NewsStatus.PUBLISHED,
      featured: true,
      pinned: true,
      priority: NewsPriority.URGENT,
      publishedAt: new Date().toISOString(),
      tags: [
        'partnership',
        'AfDB',
        'housing finance',
        'Africa',
        'affordable housing',
        '$500M',
      ],
      author: {
        name: 'Corporate Communications',
        email: 'communications@shelterafrique.org',
        title: 'Communications Team',
      },
      featuredImage:
        'https://shelterafrique.org/media/press/afdb-partnership-2024.jpg',
      attachments: [
        {
          url: 'https://shelterafrique.org/media/documents/press-release-afdb-partnership.pdf',
          type: 'document',
          caption: 'Official Press Release Document (PDF)',
          mimeType: 'application/pdf',
          size: 524288, // 512 KB
        },
      ],
      translations: [
        {
          language: 'fr',
          title:
            'ShelterAfrique annonce un partenariat avec la Banque africaine de développement pour une initiative de logement de 500 millions de dollars',
          content:
            'ShelterAfrique a conclu un partenariat stratégique avec la Banque africaine de développement (BAD)...',
          excerpt:
            'Partenariat stratégique avec la BAD pour lancer une initiative de logement de 500 millions de dollars.',
        },
      ],
      relatedNews: ['60c72b9f9b1d8c001f8e4a2c', '60c72b9f9b1d8c001f8e4a2d'],
      externalLinks: [
        'https://www.afdb.org/en/news-and-events/press-releases/afdb-shelter-afrique-partnership-housing-4567',
      ],
    },
  },
  createCorporateNews: {
    summary: 'Corporate News Example',
    description: 'Example of creating corporate news about leadership changes',
    value: {
      title: 'ShelterAfrique Appoints New Director of Sustainable Development',
      content:
        'ShelterAfrique is pleased to announce the appointment of Ms. Fatima Al-Rashid as the new Director of Sustainable Development, effective January 1, 2025. Ms. Al-Rashid brings over 15 years of experience in sustainable finance and green building technologies to her new role.\n\nIn her position, Ms. Al-Rashid will lead ShelterAfrique\'s efforts to integrate climate-resilient and environmentally sustainable practices across all housing projects. She will also oversee the implementation of the organization\'s recently launched Green Housing Initiative, which aims to ensure that 70% of all new housing projects meet international green building standards by 2027.\n\n"Fatima\'s expertise in sustainable development and her passion for environmental stewardship make her the ideal leader for this critical role," said Dr. Kingsley Mulingwa. "Her appointment reinforces our commitment to building not just affordable homes, but sustainable communities that can thrive in the face of climate challenges."',
      excerpt:
        'Ms. Fatima Al-Rashid appointed as new Director of Sustainable Development to lead climate-resilient housing initiatives.',
      slug: 'shelterafrique-appoints-fatima-al-rashid-director-sustainable-development',
      category: NewsCategory.CORPORATE,
      status: NewsStatus.DRAFT,
      featured: false,
      pinned: false,
      priority: NewsPriority.MEDIUM,
      tags: [
        'leadership',
        'appointment',
        'sustainable development',
        'green building',
      ],
      author: {
        name: 'Human Resources Department',
        email: 'hr@shelterafrique.org',
        title: 'HR Communications',
      },
      featuredImage:
        'https://shelterafrique.org/media/corporate/fatima-al-rashid.jpg',
      translations: [
        {
          language: 'fr',
          title:
            'ShelterAfrique nomme une nouvelle directrice du développement durable',
          content:
            "ShelterAfrique a le plaisir d'annoncer la nomination de Mme Fatima Al-Rashid...",
          excerpt:
            'Mme Fatima Al-Rashid nommée nouvelle directrice du développement durable pour diriger les initiatives de logement résilient au climat.',
        },
      ],
    },
  },
  createEventNews: {
    summary: 'Event News Example',
    description: 'Example of creating news about ShelterAfrique events',
    value: {
      title:
        'ShelterAfrique to Host 4th Annual African Housing Finance Conference in Lagos',
      content:
        'ShelterAfrique will host the 4th Annual African Housing Finance Conference from March 15-17, 2025, at the Eko Convention Centre in Lagos, Nigeria. The conference, themed "Bridging the Housing Gap: Innovation, Finance, and Partnerships," will bring together over 500 housing finance professionals, policymakers, and development partners from across Africa and beyond.\n\nThis year\'s conference will feature keynote addresses from prominent African leaders, technical sessions on innovative financing mechanisms, and panel discussions on public-private partnerships in housing development. Special focus will be placed on digital transformation in housing finance, climate-resilient construction techniques, and youth engagement in the housing sector.\n\nRegistration is now open at conference.shelterafrique.org. Early bird registration ends on January 31, 2025.',
      excerpt:
        '4th Annual African Housing Finance Conference scheduled for March 15-17, 2025, in Lagos, focusing on innovation and partnerships.',
      slug: '4th-annual-african-housing-finance-conference-lagos-2025',
      category: NewsCategory.EVENTS,
      status: NewsStatus.SCHEDULED,
      featured: true,
      pinned: true,
      scheduledAt: '2025-02-01T09:00:00.000Z',
      priority: NewsPriority.HIGH,
      tags: ['conference', 'Lagos', 'housing finance', 'Africa', 'March 2025'],
      author: {
        name: 'Events Team',
        email: 'events@shelterafrique.org',
        title: 'Conference Coordinator',
      },
      featuredImage:
        'https://shelterafrique.org/media/events/housing-conference-banner-2025.jpg',
      attachments: [
        {
          url: 'https://shelterafrique.org/media/documents/conference-brochure-2025.pdf',
          type: 'document',
          caption: 'Official Conference Brochure 2025',
          mimeType: 'application/pdf',
        },
        {
          url: 'https://shelterafrique.org/media/videos/conference-promo-2025.mp4',
          type: 'video',
          caption: 'Promotional Video for the 2025 Conference',
          mimeType: 'video/mp4',
        },
      ],
      relatedNews: ['5f8d0f7a9b1d8c001f8e4a2a'], // ID of last year's conference news
      externalLinks: [
        'https://conference.shelterafrique.org',
        'https://ekoconventioncentre.com',
      ],
    },
  },
};
