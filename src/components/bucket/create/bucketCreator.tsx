import { client, selectSp } from '@/client';
import { getOffchainAuthKeys } from '@/utils/offchainAuth';

export async function bucketCreator(address, bucketName, appendLog, connector){
    if (!address) return;

    const spInfo = await selectSp();
    console.log('spInfo', spInfo);
    appendLog('Starting create bucket ' + bucketName);
    const provider = await connector?.getProvider();
    const offChainData = await getOffchainAuthKeys(address, provider);
    if (!offChainData) {
      appendLog('No offchain, please create offchain pairs first');
      return;
    }
    
    const createBucketTx = await client.bucket.createBucket(
      {
        bucketName: bucketName,
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
      appendLog('Successful create bucket ' + bucketName);
    }
  }

