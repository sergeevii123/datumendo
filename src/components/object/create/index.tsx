import { client } from '@/client';
import { ACCOUNT_PRIVATEKEY } from '@/config/env';
import { getOffchainAuthKeys } from '@/utils/offchainAuth';
import { ChangeEvent, useState } from 'react';
import { useAccount, useNetwork } from 'wagmi';
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

export const CreateObject = ({ appendLog }) => {
  const { address, connector } = useAccount();
  const { chain } = useNetwork();
  const [createObjectInfo, setCreateObjectInfo] = useState({
    bucketName: '',
  });
  const ipfs = ipfsClient("https://gateway.ipfs.io/");
  const [linkInfo, setLinkInfo] = useState({
    links: [],
  });
  const [progress, setProgress] = useState(0);

  return (
    <div>
      <>
        <h4>Bucket name :</h4>
        <input className="p-4 bg-white text-black rounded-lg border border-gray-300 w-full md:w-1/2 lg:w-1/3"
          value={createObjectInfo.bucketName}
          placeholder="bucket name"
          onChange={(e) => {
            setCreateObjectInfo({ ...createObjectInfo, bucketName: e.target.value });
          }}
        />
        <br />
        <h4>Input IPFS/Arweave links</h4>
        <textarea
          className=" h-[100px] overflow-y-auto p-4 bg-white text-black rounded-lg border border-gray-300 w-full md:w-1/2 lg:w-1/3"
          value={linkInfo.links.join('\n')}
          placeholder="links separated by newline"
          style={{ width: '100%', marginBottom: 5 }}
          onChange={(e) => {
            const newLinks = e.target.value.split('\n');
            setLinkInfo({ ...linkInfo, links: newLinks });
          }}
        />
        <br />
        <button className="bg-green-600 px-4 py-2 text-white hover:bg-sky5800 sm:px-8 sm:py-3 rounded-lg" style={{marginBottom: 5}}
          onClick={async () => {
            appendLog('Initializing...');
            if (!linkInfo || !linkInfo.links.length) {
              appendLog('Please set links');
              return;
            }
            if (!address) {
              appendLog('Please select an address');
              return;
            }
            for (const singleLink of linkInfo.links) {
              if (!singleLink.startsWith("ipfs://") && !singleLink.startsWith("ar://")) {
                appendLog('Please insert link with ipfs:// or ar://');
                return;
              }
              let data, objectName;
              setProgress(10);
              appendLog("Downloading file: "+ singleLink);
              if (singleLink.startsWith("ipfs://")) {
                const cid = singleLink.replaceAll("ipfs://", "");
                data = await downloadIpfsFile(ipfs, cid);
                objectName = cid.split('/').slice(-1)[0];
              } else {
                const finalUrl = singleLink.replaceAll("ar://", "https://arweave.net/");
                data = await downloadFile(finalUrl);
                objectName = finalUrl.split('/').slice(-1)[0];
              }
              if (!data) {
                appendLog('Failed to download data');
                return;
              }
              setProgress(30);
              appendLog('Data downloaded. Calculating object hash...');
              const provider = await connector?.getProvider();
              const offChainData = await getOffchainAuthKeys(address, provider);
              if (!offChainData) {
                appendLog('No offchain, please create offchain pairs first');
                return;
              }
              const dataArray = new Uint8Array(data);
              const dataSizeInMegabytes = Math.ceil(dataArray.length / (1024 * 1024));
              console.log('dataSizeInMegabytes', dataSizeInMegabytes);
              const hashResult = await FileHandle.getCheckSums(
                dataArray,
                dataSizeInMegabytes * 1024 * 1024, // 16 * 1024 * 1024
                4,
                2
              );

              const { contentLength, expectCheckSums } = hashResult;

              console.log('offChainData', offChainData);
              console.log('hashResult ', hashResult);
              setProgress(50);
              appendLog('Calculated object hash. Creating transaction...');
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
                appendLog('Failed to create object transaction');
                return;
              }
              setProgress(70);
              appendLog('Object transaction created. Uploading...');
              // const provider = await connector?.getProvider();
              // const offChainData = await getOffchainAuthKeys(address, provider);
              let uploadRes = await client.object.uploadObject(
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
                appendLog('Upload successful!');
                if (chain?.name === 'Greenfield Testnet') {
                  appendLog("https://testnet.greenfieldscan.com/tx/"+res.transactionHash, true);
                }
                if (chain?.name === 'Greenfield Mainnet') {
                  appendLog("https://greenfieldscan.com/tx/"+res.transactionHash, true);
                }
              }
            }
          }}
        >
          Migrate objects
        </button>
      </>
      <div>
        <LoadingBar progress={progress} />
      </div>
      
    </div>
  );
};
