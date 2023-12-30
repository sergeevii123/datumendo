import { getOffchainAuthKeys } from '@/utils/offchainAuth';
import * as FileHandle from "@bnb-chain/greenfiled-file-handle";
import { client } from '@/client';
import { bucketCreator } from '@/components/bucket/create/bucketCreator';

export enum UploadType {
    Image,
    Metadata
}

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

function getDownloadLink(initialLink: string): string {
    if (initialLink.startsWith("ipfs://")) {
        return initialLink.replaceAll("ipfs://", "https://gateway.ipfs.io/ipfs/");
    } else if (initialLink.startsWith("ar://")) {
        return initialLink.replaceAll("ar://", "https://arweave.net/");
    } else if (initialLink.includes("http")) {
        return initialLink
    } else {
        return ""
    }
}

export function getFileNameWithoutExtension(url: string): string {
    return getFileName(url).split('.')[0];
}

function getFileName(url: string): string {
    return url.split('/').slice(-1)[0];
}

export async function downloadFromLink(
    fileLink: string,
    setProgress, 
    appendLog
): Promise<[Uint8Array, string]|null> {
    const finalUrl = getDownloadLink(fileLink)
    if (finalUrl == "") {
        appendLog('Unrecognized file link format');
        return null;
    }
    var fileName = getFileName(finalUrl)

    setProgress(10);
    appendLog("Downloading file: " + fileLink);
    const dataStrings = await downloadFile(finalUrl);
    if (!dataStrings) {
        appendLog('Failed to download data');
        return null;
    }
    
    setProgress(30);

    const data = new Uint8Array(dataStrings);
    return [data, fileName]
}

export async function uploadFile(
    data: Uint8Array,
    fileName: string,
    uploadType: UploadType,
    createObjectInfo,
    connector,
    address: string,
    chain,
    setProgress, 
    appendLog
): Promise<string|null> {
    await client.bucket.headBucket(createObjectInfo.bucketName).catch(async (error) => {
        appendLog('Bucket '+ createObjectInfo.bucketName+ ' does not exist. Creating bucket...');
        await bucketCreator(address, createObjectInfo.bucketName, appendLog, connector);
        return null;
    });

    var objectName: string;
    switch (+uploadType) {
        case UploadType.Image:
            objectName = "images/" + fileName
            break
        case UploadType.Metadata:
            objectName = "metadata/" + fileName
            // Additional logic to update 
            break
        default:
            objectName = fileName
    }

    // check that file is not already uploaded
    let objectExists = true;
    await client.object.headObject(createObjectInfo.bucketName, objectName).catch(async (error) => {
        objectExists = false;
    });
    if (objectExists === true) {
        appendLog('Object with name '+ objectName + ' already exists. Skipping...');
        return null;
    }

    appendLog('Data downloaded. Calculating object hash...');
    const provider = await connector?.getProvider();
    const offChainData = await getOffchainAuthKeys(address, provider);
    if (!offChainData) {
        appendLog('No offchain, please create offchain pairs first');
        return null;
    }

    const dataSizeInMegabytes = Math.ceil(data.length / (1024 * 1024));
    console.log('dataSizeInMegabytes', dataSizeInMegabytes);
    const hashResult = await FileHandle.getCheckSums(
        data,
        dataSizeInMegabytes * 1024 * 1024, // 16 * 1024 * 1024
        4,
        2
    );

    const { contentLength, expectCheckSums } = hashResult;

    console.log('offChainData', offChainData);
    console.log('hashResult ', hashResult);
    setProgress(50);
    appendLog('Calculated object hash. Creating transaction...');
    appendLog('File will be created as: ' + objectName);
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
        return null;
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
        return null;
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
        var uploadedFileURL;
        if (chain?.name === 'Greenfield Testnet') {
            const link = "https://testnet.greenfieldscan.com/tx/" + res.transactionHash
            appendLog(link, true);
            return link;
        } else if (chain?.name === 'Greenfield Mainnet') {
            const link = "https://greenfieldscan.com/tx/" + res.transactionHash
            appendLog(link, true);
            return link;
        } else {
            appendLog("Unknown network selected");
            return null;
        }
    } else {
        appendLog('Unkwnown return code ' + uploadRes.code);
        return null;
    }
}
