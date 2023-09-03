import { client } from '@/client';
import { ACCOUNT_PRIVATEKEY } from '@/config/env';
import { getOffchainAuthKeys } from '@/utils/offchainAuth';
import { ChangeEvent, useState } from 'react';
import { useAccount } from 'wagmi';
import ipfsClient from 'ipfs-http-client';
import uint8ArrayConcat from "uint8arrays/concat";
import mime from 'mime';
import * as FileHandle from "@bnb-chain/greenfiled-file-handle";
import LoadingBar from './loading_bar';

async function downloadIpfsFile(ipfs: any, cid: any) {
  let data = [];

  for await (const file of ipfs.get(cid)) {
      if (file.type == "file" && file.content) {
          for await (const chunk of file.content) {
              data.push(chunk);
          }
      }
  }

  return uint8ArrayConcat(data);
}

async function downloadFile(finalURL: any) {
  let data = [];

  // Fetch the file from the given URL
  const res = await fetch(finalURL);

  const reader = res.body.getReader();
    
  // Read the stream
  while (true) {
      const { done, value } = await reader.read();

      if (done) {
          break;
      }

      data.push(value);
  }

  return uint8ArrayConcat(data);
}

export const CreateObject = () => {
  const { address, connector } = useAccount();
  const [status, setStatus] = useState<string>('');
  const [createObjectInfo, setCreateObjectInfo] = useState({
    bucketName: '',
  });
  const ipfs = ipfsClient("https://gateway.ipfs.io/")
  const [linkInfo, setLinkInfo] = useState({
    link: '',
  });
  const [progress, setProgress] = useState(0);

  return (
    <div>
      <>
        <h4>Bucket name :</h4>
        <input class="p-4 bg-white text-black rounded-lg border border-gray-300 w-full md:w-1/2 lg:w-1/3"
          value={createObjectInfo.bucketName}
          placeholder="bucket name"
          onChange={(e) => {
            setCreateObjectInfo({ ...createObjectInfo, bucketName: e.target.value });
          }}
        />
        <br />
        <h4>Input IPFS/Arweave link</h4>
        <textarea
          class=" h-[100px] overflow-y-auto p-4 bg-white text-black rounded-lg border border-gray-300 w-full md:w-1/2 lg:w-1/3"
          rows="1"
          value={linkInfo.link}
          placeholder="link"
          style={{ width: '700px', marginBottom: 5 }}
          onChange={(e) => {
            setLinkInfo({ ...linkInfo, link: e.target.value });
          }}
        />
        <br />
        <button class="bg-sky-700 px-4 py-2 text-white hover:bg-sky-800 sm:px-8 sm:py-3 rounded-lg" 
          onClick={async () => {
            setStatus('Initializing...');
            if (!linkInfo ) {
              setStatus('Please set link');
              return;
            }
            if (!address) {
              setStatus('Please select an address');
              return;
            }
            if (!linkInfo.link.startsWith("ipfs://") && !linkInfo.link.startsWith("ar://")) {
              setStatus('Please insert link with ipfs:// or ar://');
              return;
            }
            let data, objectName;
            setStatus('Downloading data...');
            setProgress(10);
            if (linkInfo.link.startsWith("ipfs://")) {
              const cid = linkInfo.link.replaceAll("ipfs://", "");
              console.log("Downloading file:", cid);
              data = await downloadIpfsFile(ipfs, cid);
              objectName = cid.split('/').slice(-1)[0];
            } else {
              const finalUrl = linkInfo.link.replaceAll("ar://", "https://arweave.net/");
              console.log("Downloading file: " + finalUrl);
              data = await downloadFile(finalUrl);
              objectName = finalUrl.split('/').slice(-1)[0];
            }
            if (!data) {
              setStatus('Failed to download data');
              return;
            }
            setProgress(30);
            setStatus('Data downloaded. Calculating object hash...');
            const provider = await connector?.getProvider();
            const offChainData = await getOffchainAuthKeys(address, provider);
            if (!offChainData) {
              setStatus('No offchain, please create offchain pairs first');
              return;
            }
            const hashResult = await FileHandle.getCheckSums(
              new Uint8Array(data),
              16 * 1024 * 1024,
              4,
              2
            );

            const { contentLength, expectCheckSums } = hashResult;

            console.log('offChainData', offChainData);
            console.log('hashResult', hashResult);
            setProgress(50);
            setStatus('Calculated object hash. Creating transaction...');
            const createObjectTx = await client.object.createObject(
              {
                bucketName: createObjectInfo.bucketName,
                objectName: objectName,
                creator: address,
                visibility: 'VISIBILITY_TYPE_PRIVATE',
                fileType: mime.getType(data),
                redundancyType: 'REDUNDANCY_EC_TYPE',
                contentLength,
                expectCheckSums: JSON.parse(expectCheckSums),
              },
              {
                type: 'EDDSA',
                domain: window.location.origin,
                seed: offChainData.seedString,
                address,
                // type: 'ECDSA',
                // privateKey: ACCOUNT_PRIVATEKEY,
              },
            );
            const simulateInfo = await createObjectTx.simulate({
              denom: 'BNB',
            });

            console.log('simulateInfo', simulateInfo);

            const res = await createObjectTx.broadcast({
              denom: 'BNB',
              gasLimit: Number(simulateInfo?.gasLimit),
              gasPrice: simulateInfo?.gasPrice || '5000000000',
              payer: address,
              granter: '',
            });

            console.log('res', res);
            if (res.code !== 0) {
              setStatus('Failed to create object transaction');
              return;
            }
            setProgress(70);
            setStatus('Object transaction created. Uploading...');
            // const provider = await connector?.getProvider();
            // const offChainData = await getOffchainAuthKeys(address, provider);
            const uploadRes = await client.object.uploadObject(
              {
                bucketName: createObjectInfo.bucketName,
                objectName: objectName,
                body: data,
                txnHash: res.transactionHash,
              },
              {
                type: 'EDDSA',
                domain: window.location.origin,
                seed: offChainData.seedString,
                address,
              },
            );
            console.log('uploadRes', uploadRes);

            if (uploadRes.code === 0) {
              setProgress(100);
              setStatus('Upload successful!');
            }
          }}
      >
        Migrate object
        </button>
      </>
      <div>
        <strong>Status: </strong>{status}
      </div>
      <div>
      <LoadingBar progress={progress} />
      </div>
    </div>
  );
};
