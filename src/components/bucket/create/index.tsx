import { client, selectSp } from '@/client';
import { ACCOUNT_PRIVATEKEY } from '@/config/env';
import { getOffchainAuthKeys } from '@/utils/offchainAuth';
import { useState } from 'react';
import { useAccount } from 'wagmi';

export const CreateBucket = ({ appendLog }) => {
  const { address, connector } = useAccount();
  const [createBucketInfo, setCreateBucketInfo] = useState<{
    bucketName: string;
  }>({
    bucketName: '',
  });

  return (
    <>
      <h4>Bucket name :</h4>
      <input className="p-4 bg-white text-black rounded-lg border border-gray-300 w-full md:w-1/2 lg:w-1/3"
        value={createBucketInfo.bucketName}
        style={{ width: '100%', marginBottom: 5 }}
        placeholder="bucket name"
        onChange={(e) => {
          setCreateBucketInfo({ ...createBucketInfo, bucketName: e.target.value });
        }}
      />
      <br />
      <button className="bg-green-600 px-4 py-2 text-white hover:bg-green-500 sm:px-8 sm:py-3 rounded-lg w-full"
        onClick={async () => {
          if (!address) return;

          const spInfo = await selectSp();
          console.log('spInfo', spInfo);
          appendLog('Starting create bucket ' + createBucketInfo.bucketName);
          const provider = await connector?.getProvider();
          const offChainData = await getOffchainAuthKeys(address, provider);
          if (!offChainData) {
            appendLog('No offchain, please create offchain pairs first');
            return;
          }

          const createBucketTx = await client.bucket.createBucket(
            {
              bucketName: createBucketInfo.bucketName,
              creator: address,
              visibility: 'VISIBILITY_TYPE_PUBLIC_READ',
              chargedReadQuota: '0',
              spInfo: {
                primarySpAddress: spInfo.primarySpAddress,
              },
              paymentAddress: address,
            },
            {
              type: 'EDDSA',
              domain: window.location.origin,
              seed: offChainData.seedString,
              address,
            },
          );

          const simulateInfo = await createBucketTx.simulate({
            denom: 'BNB',
          });

          console.log('simulateInfo', simulateInfo);

          const res = await createBucketTx.broadcast({
            denom: 'BNB',
            gasLimit: Number(simulateInfo?.gasLimit),
            gasPrice: simulateInfo?.gasPrice || '5000000000',
            payer: address,
            granter: '',
          });

          if (res.code === 0) {
            appendLog('Successful create bucket ' + createBucketInfo.bucketName);
          }
        }}
      >
        Create bucket
      </button>
    </>
  );
};
