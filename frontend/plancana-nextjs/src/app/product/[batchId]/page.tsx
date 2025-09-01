import QRVerificationPage from '@/components/verification/QRVerificationPage';

interface ProductPageProps {
  params: {
    batchId: string;
  };
}

export default function ProductPage({ params }: ProductPageProps) {
  return <QRVerificationPage batchId={params.batchId} />;
}