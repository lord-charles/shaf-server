import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Enums
export enum PanelistRole {
  KEYNOTE_SPEAKER = 'keynote_speaker',
  PANEL_MODERATOR = 'panel_moderator',
  PANEL_DISCUSSANT = 'panel_discussant',
  WORKSHOP_FACILITATOR = 'workshop_facilitator',
  TECHNICAL_EXPERT = 'technical_expert',
  INDUSTRY_LEADER = 'industry_leader',
  FIRESIDE_CHAT_GUEST = 'fireside_chat_guest',
  SESSION_CHAIR = 'session_chair',
  CASE_STUDY_PRESENTER = 'case_study_presenter',
  KEY_PARTNER_REPRESENTATIVE = 'key_partner_representative',
}

export enum OrganizationType {
  GOVERNMENT = 'government',
  PRIVATE_SECTOR = 'private_sector',
  NGO = 'ngo',
  INTERNATIONAL_ORGANIZATION = 'international_organization',
  ACADEMIC_INSTITUTION = 'academic_institution',
  DEVELOPMENT_FINANCE_INSTITUTION = 'development_finance_institution',
  CONSULTING_FIRM = 'consulting_firm',
  MULTILATERAL_BANK = 'multilateral_bank',
  CIVIL_SOCIETY = 'civil_society',
  STATE_OWNED_ENTERPRISE = 'state_owned_enterprise',
  RESEARCH_INSTITUTE = 'research_institute',
}

export enum ExpertiseArea {
  HOUSING_FINANCE = 'housing_finance',
  URBAN_DEVELOPMENT = 'urban_development',
  REAL_ESTATE = 'real_estate',
  POLICY_REGULATION = 'policy_regulation',
  SUSTAINABLE_DEVELOPMENT = 'sustainable_development',
  FINANCIAL_INCLUSION = 'financial_inclusion',
  INFRASTRUCTURE = 'infrastructure',
  ESG_GOVERNANCE = 'esg_governance',
  ENVIRONMENTAL_SUSTAINABILITY = 'environmental_sustainability',
  SOCIAL_DEVELOPMENT = 'social_development',
  CLIMATE_RESILIENCE = 'climate_resilience',
  LAND_TENURE = 'land_tenure',
  PUBLIC_PRIVATE_PARTNERSHIPS = 'public_private_partnerships',
  CONSTRUCTION_TECHNOLOGY = 'construction_technology',
}

export enum ParticipationMode {
  IN_PERSON = 'in_person',
  VIRTUAL = 'virtual',
  HYBRID = 'hybrid',
}

// MongoDB Schema
@Schema({
  collection: 'agm_panelists',
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function (doc, ret) {
      delete ret.__v;
      return ret;
    },
  },
})
export class Panelist extends Document {
  @Prop({ required: true, trim: true, maxlength: 100 })
  firstName: string;

  @Prop({ required: true, trim: true, maxlength: 100 })
  lastName: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, trim: true })
  phoneNumber: string;

  @Prop({ required: true })
  eventYear: number;

  @Prop({ required: true, trim: true, maxlength: 150 })
  jobTitle: string;

  @Prop({ required: true, trim: true, maxlength: 150 })
  organization: string;

  @Prop({ required: true, enum: OrganizationType })
  organizationType: OrganizationType;

  @Prop({ required: true, trim: true, maxlength: 100 })
  country: string;

  @Prop({ required: true, trim: true, maxlength: 100 })
  city: string;

  @Prop({ required: true, enum: PanelistRole })
  role: PanelistRole;

  @Prop({ required: true, type: [String], enum: ExpertiseArea })
  expertiseAreas: ExpertiseArea[];

  @Prop({ required: true, trim: true, maxlength: 1000 })
  biography: string;

  @Prop({ required: true, enum: ParticipationMode })
  participationMode: ParticipationMode;

  @Prop({ trim: true })
  linkedinProfile?: string;

  @Prop({ trim: true })
  companyWebsite?: string;

  @Prop({ trim: true, maxlength: 500 })
  specialRequirements?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isConfirmed: boolean;

  @Prop()
  confirmedAt?: Date;

  @Prop({ trim: true })
  profileImageUrl?: string;

  @Prop({ trim: true, maxlength: 200 })
  sessionTitle?: string;

  @Prop({ trim: true, maxlength: 1000 })
  sessionDescription?: string;

  @Prop()
  sessionDateTime?: Date;

  @Prop({ default: Date.now })
  registeredAt: Date;
}

export const PanelistSchema = SchemaFactory.createForClass(Panelist);

// Create indexes for better performance
PanelistSchema.index({ email: 1 });
PanelistSchema.index({ role: 1 });
PanelistSchema.index({ organizationType: 1 });
PanelistSchema.index({ country: 1 });
PanelistSchema.index({ isActive: 1, isConfirmed: 1 });

// Virtual for full name
PanelistSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});
