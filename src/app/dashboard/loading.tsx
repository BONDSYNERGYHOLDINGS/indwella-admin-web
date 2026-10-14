import { Spinner } from '@/components/Spinner';

// Next.js shows this inside the dashboard layout (sidebar stays put) while a
// dashboard route segment is loading.
export default function DashboardLoading() {
  return <Spinner />;
}
