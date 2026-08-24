import { getAdminClinicsList } from '@/lib/admin/service';
import ClinicsAdminClient from './ClinicsAdminClient';

export default async function AdminClinicsPage() {
  const clinics = await getAdminClinicsList();

  return <ClinicsAdminClient initialClinics={clinics} />;
}
