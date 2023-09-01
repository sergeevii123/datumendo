import { Bucket } from '@/components/bucket';
import { ObjectComponent } from '@/components/object';
import { WalletInfo } from '@/components/walletInfo';
import { useIsMounted } from '@/hooks/useIsMounted';
import { useAccount } from 'wagmi';
import { DownloaderComponent } from '@/components/downloader';

export default function Home() {
  const isMounted = useIsMounted();
  const { isConnected } = useAccount();

  if (!isMounted) return null;

  return (
    <div style={{ padding: 10}} >
      <WalletInfo />

      {isConnected && (
        <>
          <Bucket />
          <hr style={{ margin: '10px 0' }} />
          <ObjectComponent />
        </>
      )}
    </div>
  );
}
