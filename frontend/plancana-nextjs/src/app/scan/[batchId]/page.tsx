import QRVerificationPage from '@/components/verification/QRVerificationPage';

interface ScanPageProps {
  params: {
    batchId: string;
  };
}

export default function ScanPage({ params }: ScanPageProps) {
  return <QRVerificationPage batchId={params.batchId} />;
}