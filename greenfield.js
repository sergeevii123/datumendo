const { Client } = require('@bnb-chain/greenfield-chain-sdk');
// const { Client } = require('@bnb-chain/greenfield-js-sdk');
const fs = require('fs');
const gf = require('@bnb-chain/greenfiled-file-handle');
const mime = require('mime');
const client = Client.create('https://gnfd-testnet-fullnode-tendermint-us.bnbchain.org', '5600');

ADDRESS = ""
PRIVATE_KEY = ""

(async () => {
    const account = await client.account.getAccount('');
    const fileBytes = fs.readFileSync("2696.png");
    const hashResult = await gf.getCheckSums(
        new Uint8Array(fileBytes)
      );
    const { expectCheckSums, contentLength} = hashResult;
    console.log(contentLength, expectCheckSums, mime.getType("2696.png"));
        try {
    const createObjectTx = await client.object.createObject({
        bucketName: "tut",
        objectName: "2696.png",
        creator: ADDRESS,
        visibility: 'VISIBILITY_TYPE_PUBLIC_READ',
        fileType: mime.getType("2696.png"),
        redundancyType: 'REDUNDANCY_EC_TYPE',
        contentLength,
        expectCheckSums,
        // duration: 1000,
        // signType: 'authTypeV1',
        // privateKey: PRIVATE_KEY,
      },
      {
        type: 'ECDSA',
        privateKey: PRIVATE_KEY
    });
    console.log('createObjectTx', createObjectTx)
      const simulateInfo = await createObjectTx.simulate({
        denom: 'BNB',
      });

      console.log('simulateInfo', simulateInfo);

      const res = await createObjectTx.broadcast({
        denom: 'BNB',
        gasLimit: Number(simulateInfo?.gasLimit),
        gasPrice: simulateInfo?.gasPrice || '5000000000',
        payer: ADDRESS,
        granter: '',
        privateKey: PRIVATE_KEY,
      });
    // const { contentLength, expectCheckSums } = hashResult;
    txhash = res.transactionHash;
    client.object.uploadObject(
        {
          bucketName: "tut",
          objectName: "2696.png",
          body: fs.readFileSync("2696.png"),
          txnHash: txhash,
          signType: 'authTypeV1',
        privateKey: PRIVATE_KEY,
        },
      );
    console.log(account);
    } catch (e) {
        console.log(e);
    }
    
})();

// this code actually worked for creating of the bucket before the update
// (async () => {
//     try {
//     const createBucketTx = await client.bucket.createBucket({
//         bucketName: 'foo',
//         creator: ADDRESS,
//         visibility: 'VISIBILITY_TYPE_PUBLIC_READ',
//         chargedReadQuota: '0',
//         spInfo: {
//           primarySpAddress: '0xcf8351B881D578DaCEeb7fc55B0b4fB0971070f6',
//         },
//         signType: 'authTypeV1',
//         privateKey: PRIVATE_KEY,
//         // signType: 'offChainAuth',
//         // domain: window.location.origin,
//         // seedString: offChainData.seedString,
//       });
//     } catch (e) {
//         console.log(e);
//     }
    
//       const simulateInfo = await createBucketTx.simulate({
//         denom: 'BNB',
//       });
    
//       console.log('simulateInfo', simulateInfo);
    
//       const res = await createBucketTx.broadcast({
//         denom: 'BNB',
//         gasLimit: Number(simulateInfo?.gasLimit),
//         gasPrice: simulateInfo?.gasPrice || '5000000000',
//         payer: ADDRESS,
//         granter: '',
//         privateKey: PRIVATE_KEY,
//       });
    
//       if (res.code === 0) {
//         console.log('success');
//       }
//   })();