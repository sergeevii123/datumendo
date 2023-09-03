import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useDisconnect, useAccount } from 'wagmi';

export const WalletInfo = () => {
  const { disconnect } = useDisconnect();
  const { isConnected } = useAccount();
  return (
    <div className={`${isConnected ? '' : 'flex justify-center items-center h-screen'}`}>
      <ConnectButton accountStatus="address" />
    </div>
  );
};
