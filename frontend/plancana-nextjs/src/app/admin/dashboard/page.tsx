import ProtectedRoute from '@/components/common/ProtectedRoute';
import Layout from '@/components/layout/Layout';
import AdminDashboard from '@/components/dashboard/ProcessorDashboard';

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute roles={['ADMIN']}>
      <Layout>
        <AdminDashboard />
      </Layout>
    </ProtectedRoute>
  );
}