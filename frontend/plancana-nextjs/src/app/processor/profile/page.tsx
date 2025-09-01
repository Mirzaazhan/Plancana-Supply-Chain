import ProtectedRoute from '@/components/common/ProtectedRoute';
import Layout from '@/components/layout/Layout';
import ProfileManagement from '@/components/profile/ProfileManagement';

export default function ProcessorProfilePage() {
  return (
    <ProtectedRoute roles={['PROCESSOR']}>
      <Layout>
        <ProfileManagement />
      </Layout>
    </ProtectedRoute>
  );
}