import { getOffchainAuthKeys } from '@/utils/offchainAuth';
import * as FileHandle from "@bnb-chain/greenfiled-file-handle";
import { client } from '@/client';
import { bucketCreator } from '@/components/bucket/create/bucketCreator';

function concatArrayBuffers(chunks: Uint8Array[]): Uint8Array {
    const result = new Uint8Array(chunks.reduce((a, c) => a + c.length, 0));
    let offset = 0;
    for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
    }
    return result;
}

async function streamToArrayBuffer(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
    const chunks: Uint8Array[] = [];
    const reader = stream.getReader();
    while (true) {
        const { done, value } = await reader.read();
        if (done) {
            break;
        } else {
            chunks.push(value);
        }
    }
    return concatArrayBuffers(chunks);
}


async function downloadFile(finalURL: any) {
    const res = await fetch(finalURL);
    return streamToArrayBuffer(res.body!);
}

export async function uploadFiles(singleLink: String, createObjectInfo, appendLog, setProgress, connector, address:string, chain) {
    await client.bucket.headBucket(createObjectInfo.bucketName).catch(async (error) => {
        appendLog('Bucket '+ createObjectInfo.bucketName+ 'does not exist. Creating bucket...');
        await bucketCreator(address, createObjectInfo.bucketName, appendLog, connector);
    });
    if (!singleLink.startsWith("ipfs://") && !singleLink.startsWith("ar://")) {
        appendLog('Please insert link with ipfs:// or ar://');
        return;
    }
    let data, objectName;
    setProgress(10);
    appendLog("Downloading file: " + singleLink);
    if (singleLink.startsWith("ipfs://")) {
        const cid = singleLink.replaceAll("ipfs://", "");
        // data = await downloadIpfsFile(ipfs, cid);
        const finalUrl = singleLink.replaceAll("ipfs://", "https://gateway.ipfs.io/ipfs/");
        data = await downloadFile(finalUrl);
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
            fileType: "",
            redundancyType: 'REDUNDANCY_EC_TYPE',
            contentLength,
            expectCheckSums: JSON.parse(expectCheckSums),
        },
        {
            type: 'EDDSA',
            domain: window.location.origin,
            seed: offChainData.seedString,
            address,
        },
    );

    let simulateError;
    const simulateInfo = await createObjectTx.simulate({
        denom: 'BNB',
    })
        .catch(error => {
            appendLog('Transaction is likely to fail: ' + error.message);
            simulateError = true;
        });

    if (simulateError) {
        setProgress(0);
        appendLog('Please try again');
        return;
    }

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
            appendLog("https://testnet.greenfieldscan.com/tx/" + res.transactionHash, true);
        }
        if (chain?.name === 'Greenfield Mainnet') {
            appendLog("https://greenfieldscan.com/tx/" + res.transactionHash, true);
        }
    }
}