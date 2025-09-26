import QRVerificationPage from '@/components/verification/QRVerificationPage';

interface ProductPageProps {
  params: Promise<{
    batchId: string;
  }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { batchId } = await params;
  return <QRVerificationPage batchId={batchId} />;
}