import { client } from '@/client';
import { ACCOUNT_PRIVATEKEY } from '@/config/env';
import { getOffchainAuthKeys } from '@/utils/offchainAuth';
import { ChangeEvent, useState } from 'react';
import { useAccount } from 'wagmi';
import ipfsClient from 'ipfs-http-client';
import uint8ArrayConcat from "uint8arrays/concat";
import mime from 'mime';

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
export const CreateObject = () => {
  const { address, connector } = useAccount();
  const [file, setFile] = useState<File>();
  const [txHash, setTxHash] = useState<string>();
  const [createObjectInfo, setCreateObjectInfo] = useState({
    bucketName: '',
    objectName: '',
  });
  const ipfs = ipfsClient("http://gateway.ipfs.io")
  const [linkInfo, setLinkInfo] = useState({
    link: '',
  });

  return (
    <div>
      <>
        <h4>Create Object</h4>
        bucket name :
        <input
          value={createObjectInfo.bucketName}
          placeholder="bucket name"
          onChange={(e) => {
            setCreateObjectInfo({ ...createObjectInfo, bucketName: e.target.value });
          }}
        />
        <br />
        object name :
        <input
          value={createObjectInfo.objectName}
          placeholder="object name"
          onChange={(e) => {
            setCreateObjectInfo({ ...createObjectInfo, objectName: e.target.value });
          }}
        />
        <br />
        {/* <input
          type="file"
          placeholder="select a file"
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            if (e.target.files) {
              setFile(e.target.files[0]);
            }
          }}
        /> */}
        <input
          value={linkInfo.link}
          placeholder="link"
          style={{ width: '600px' }} 
          onChange={(e) => {
            setLinkInfo({ ...linkInfo, link: e.target.value });
          }}
        />
        <br />
        <button
          onClick={async () => {
            if (!linkInfo ) {
              alert('Please set link');
              return;
            }
            const cid = linkInfo.link.replaceAll("ipfs://", "");
            
            console.log("Downloading file:", cid);
            
            const data = await downloadIpfsFile(ipfs, cid);
            setFile(data);
            alert('download object success');
          }}
      >
        Download
        </button>
        <br />
        <button
          onClick={async () => {
            if (!address || !file) {
              alert('Please select a file or address');
              return;
            }

            const provider = await connector?.getProvider();
            const offChainData = await getOffchainAuthKeys(address, provider);
            if (!offChainData) {
              alert('No offchain, please create offchain pairs first');
              return;
            }

            // const fileBytes = await file.arrayBuffer();
            const hashResult = await (window as any).FileHandle.getCheckSums(
              new Uint8Array(file),
            );
            const { contentLength, expectCheckSums } = hashResult;

            console.log('offChainData', offChainData);
            console.log('hashResult', hashResult);

            const createObjectTx = await client.object.createObject(
              {
                bucketName: createObjectInfo.bucketName,
                objectName: createObjectInfo.objectName,
                creator: address,
                visibility: 'VISIBILITY_TYPE_PRIVATE',
                fileType: mime.getType(file),
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

            if (res.code === 0) {
              alert('create object tx success');

              setTxHash(res.transactionHash);
            }
          }}
        >
          1. create object tx
        </button>
        <br />
        <button
          onClick={async () => {
            if (!address || !file || !txHash) return;
            console.log(file);

            const provider = await connector?.getProvider();
            const offChainData = await getOffchainAuthKeys(address, provider);
            if (!offChainData) {
              alert('No offchain, please create offchain pairs first');
              return;
            }

            const uploadRes = await client.object.uploadObject(
              {
                bucketName: createObjectInfo.bucketName,
                objectName: createObjectInfo.objectName,
                body: file,
                txnHash: txHash,
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
              alert('success');
            }
          }}
        >
          2. upload
        </button>
        <br />
        <button
          onClick={async () => {
            if (!address) return;

            const provider = await connector?.getProvider();
            const offChainData = await getOffchainAuthKeys(address, provider);
            if (!offChainData) {
              alert('No offchain, please create offchain pairs first');
              return;
            }

            const createFolderTx = await client.object.createFolder(
              {
                bucketName: createObjectInfo.bucketName,
                objectName: createObjectInfo.objectName + '/',
                creator: address,
              },
              {
                type: 'EDDSA',
                domain: window.location.origin,
                seed: offChainData.seedString,
                address,
              },
            );

            const simulateInfo = await createFolderTx.simulate({
              denom: 'BNB',
            });

            console.log('simulateInfo', simulateInfo);

            const res = await createFolderTx.broadcast({
              denom: 'BNB',
              gasLimit: Number(simulateInfo?.gasLimit),
              gasPrice: simulateInfo?.gasPrice || '5000000000',
              payer: address,
              granter: '',
            });

            console.log('res', res);

            if (res.code === 0) {
              alert('success');
            }
          }}
        >
          create folder
        </button>
      </>
    </div>
  );
};
