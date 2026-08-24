import { z } from 'zod';

export const step1Schema = z.object({
  name: z.string().min(2, "Clinic name must be at least 2 characters."),
  phone: z.string().min(10, "Phone number must be at least 10 characters."),
  email: z.string().email("Invalid email address."),
  address: z.string().min(5, "Address is required."),
  timezone: z.string().min(1, "Timezone is required."),
  description: z.string().optional(),
  logo: z.any().optional(), // Represents file upload or URL
});

export type Step1Data = z.infer<typeof step1Schema>;

export const step2Schema = z.object({
  hasWebsite: z.enum(["yes", "no"]),
});

export type Step2Data = z.infer<typeof step2Schema>;

export const pathASchema = z.object({
  websiteUrl: z.string().url("Must be a valid URL."),
});

export type PathAData = z.infer<typeof pathASchema>;

export const pathBSchema = z.object({
  clinicInfo: z.string().min(10, "Provide some info about your clinic."),
  services: z.string().min(2, "List at least one service."),
  dentists: z.string().min(2, "List at least one dentist."),
  staff: z.string().optional(),
  hours: z.string().min(5, "Business hours are required."),
  branding: z.string().min(1, "Branding color is required."),
  desiredSiteName: z.string().min(2, "Desired site name is required."),
  domainPreference: z.string().min(3, "Domain preference is required."),
});

export type PathBData = z.infer<typeof pathBSchema>;

export type OnboardingState = {
  step: number;
  clinicId?: string;
  step1Data?: Step1Data;
  step2Data?: Step2Data;
  pathAData?: PathAData;
  pathBData?: PathBData;
};
