const ipfsClient = require('ipfs-http-client');
const uint8ArrayConcat = require("uint8arrays/concat");
const fs = require('fs');
const path = require('path');
const CID = 'bafykbzaceatihez66rzmzuvfx5nqqik73hlphem3dvagmixmay3arvqd66ng6'; // Replace with your constant path/CID

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
    const ipfs = ipfsClient("http://gateway.ipfs.io")
    console.log("created ipfs");
    try {
        const data = await downloadIpfsFile(ipfs, cid);
        
        // Define the path where the file will be saved
        const filePath = path.join(__dirname, 'downloaded_file'); // This will save in the current directory
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