import { client, selectSp } from '@/client';
import { ACCOUNT_PRIVATEKEY } from '@/config/env';
import { getOffchainAuthKeys } from '@/utils/offchainAuth';
import { useState } from 'react';
import { useAccount } from 'wagmi';
import { bucketCreator } from './bucketCreator';

export const CreateBucket = ({ appendLog }) => {
  const { address, connector } = useAccount();
  const [createBucketInfo, setCreateBucketInfo] = useState<{
    bucketName: string;
  }>({
    bucketName: '',
  });

  return (
    <>
      <h4>Bucket name:</h4>
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
          await bucketCreator(address, createBucketInfo.bucketName, appendLog, connector);
        }}
      >
        Create bucket
      </button>
    </>
  );
};
