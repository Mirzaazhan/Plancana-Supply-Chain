import ProtectedRoute from '@/components/common/ProtectedRoute';
import Layout from '@/components/layout/Layout';
import UserManagement from '@/components/admin/UserManagement';

export default function AdminUsersPage() {
  return (
    <ProtectedRoute roles={['ADMIN']}>
      <Layout>
        <UserManagement />
      </Layout>
    </ProtectedRoute>
  );
}
