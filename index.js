const ipfsClient = require('ipfs-http-client');
const uint8ArrayConcat = require("uint8arrays/concat");
const fs = require('fs');
const path = require('path');
// const exampleIPFSCID = 'bafybeiagtega7rplvxmisdplxpc47oaqnkf4vwuxnk3tb6ufe2yahnvn2i/2697.png'; // Replace with your constant path/CID
const ipfs = ipfsClient("http://gateway.ipfs.io")
console.log("created ipfs");
const [,,fileLink] = process.argv;

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

async function download() {
    // const cid = exampleIPFSCID
    if (fileLink.includes("ipfs://")) {
        cid = fileLink.replaceAll("ipfs://", "")
    } else {
        cid = fileLink
    }

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

download()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
