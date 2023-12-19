import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useDisconnect, useAccount } from 'wagmi';

export const WalletInfo = () => {
  const { disconnect } = useDisconnect();
  const { isConnected } = useAccount();
  return (
    <div>
      <ConnectButton accountStatus="address" />
    </div>
  );
};
