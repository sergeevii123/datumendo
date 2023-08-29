const fs = require('fs');
var url = require("url");
var path = require("path");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const exampleIPFSCID = 'bafykbzaceatihez66rzmzuvfx5nqqik73hlphem3dvagmixmay3arvqd66ng6'; // Replace with your constant path/CID

const [,,fileLink] = process.argv;

async function download() {
    console.log("1")
    if (!fileLink || fileLink == "") {
        console.log("Invalid link")
    }
    console.log("File link: " + fileLink)
    var finalURL
    if (fileLink.includes("ar://")) {
        finalURL = fileLink.replaceAll("ar://", "https://arweave.net/")
    }
    console.log("Final download URL: " + finalURL)

    
    var parsed = url.parse(finalURL);
    const fileName = path.basename(parsed.pathname)
    console.log("File name: " + fileName);

    const filePath = path.join(__dirname, fileName); // This will save in the 

    const res = await fetch(finalURL);
    const fileStream = fs.createWriteStream(filePath);
    await new Promise((resolve, reject) => {
        res.body.pipe(fileStream);
        res.body.on("error", reject);
        fileStream.on("finish", resolve);
        });
}

download()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
