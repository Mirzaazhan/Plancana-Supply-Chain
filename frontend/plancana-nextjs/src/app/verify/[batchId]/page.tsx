import QRVerificationPage from '@/components/verification/QRVerificationPage';

interface VerifyPageProps {
  params: {
    batchId: string;
  };
}

export default function VerifyPage({ params }: VerifyPageProps) {
  return <QRVerificationPage batchId={params.batchId} />;
}