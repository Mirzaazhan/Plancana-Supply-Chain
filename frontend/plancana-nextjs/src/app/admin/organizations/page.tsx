import ProtectedRoute from '@/components/common/ProtectedRoute';
import Layout from '@/components/layout/Layout';
import OrganizationManagement from '@/components/admin/OrganizationManagement';

export default function OrganizationsPage() {
  return (
    <ProtectedRoute roles={['ADMIN']}>
      <Layout>
        <OrganizationManagement />
      </Layout>
    </ProtectedRoute>
  );
}
