const ipfsClient = require('ipfs-http-client');
const uint8ArrayConcat = require("uint8arrays/concat");
const fs = require('fs');
const path = require('path');
const CID = 'bafybeiagtega7rplvxmisdplxpc47oaqnkf4vwuxnk3tb6ufe2yahnvn2i/2697.png'; // Replace with your constant path/CID
const ipfs = ipfsClient("http://gateway.ipfs.io")
console.log("created ipfs");

async function downloadIpfsFile(ipfs, cid) {
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

async function download(cid) {
    console.log("Downloading file:", cid);
    try {
        const data = await downloadIpfsFile(ipfs, cid);
        const fileName = cid.split('/').slice(-1)[0]; // Get the file name from the CID
        // Define the path where the file will be saved
        const filePath = path.join(__dirname, fileName); // This will save in the current directory
        console.log("File path:", filePath);
        
        // Write data to a file
        fs.writeFileSync(filePath, data);
        console.log(`File saved at ${filePath}`);
    } catch (err) {
        console.error("Download failed:", err);
    }
}

// Automatically try to download the file when the script loads
download(CID);