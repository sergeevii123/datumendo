import { createPublicClient, http } from "viem";
import { bscTestnet, bsc, opBNB, opBNBTestnet } from "wagmi/chains";
import { erc721EnumerableAbi } from "@/lib/abi";
import { ethers } from "ethers";
import { resolve } from "path";

interface NFT {
    tokenId: string;
    metadata?: Metadata;
}

interface Metadata {
    [key: string]: any;
}

function fetchWithTimeout(url, timeout = 5000) { // timeout in milliseconds
    return new Promise((resolve, reject) => {
      // Set timeout timer
      const timer = setTimeout(() => {
        reject(new Error('Request timed out'));
      }, timeout);
  
      fetch(url)
        .then(response => resolve(response))
        .catch(err => reject(err))
        .finally(() => clearTimeout(timer)); // Clear the timeout timer
    });
  }

export async function handleClickFetchNFTData (chainId, nftAddress, erc165, erc721Enumerable, ERC721EnumerableInterfaceID, setNftData, appendLog){
        console.log("chainId", chainId);
        appendLog("Starting fetching nft for nftAddress: " + nftAddress);
        if (!ethers.utils.isAddress(nftAddress)) {
            appendLog("Invalid NFT Contract Address");
            return false;
        }
        if (!erc165 || !erc721Enumerable) {
            appendLog("Contract is not defined");
            return false;
        }
        
        const isSupportsInterface = await erc165.supportsInterface(ERC721EnumerableInterfaceID).catch(() => {
            appendLog("Contract does not support ERC721Enumerable");
            return false;
        });
        if (isSupportsInterface === false) {
            return false;
        }
        const totalSupply = await erc721Enumerable.totalSupply();

        let publicClient;
        if (chainId === 97) {
            publicClient = createPublicClient({
                chain: bscTestnet,
                transport: http(),
            });
        } else if (chainId === 5611) {
            publicClient = createPublicClient({
                chain: opBNBTestnet,
                transport: http(),
            });
        } else if (chainId === 56) {
            publicClient = createPublicClient({
                chain: bsc,
                transport: http(),
            });
        } else if (chainId === 204) {
            publicClient = createPublicClient({
                chain: opBNB,
                transport: http(),
            });
        } else {
            throw new Error("Invalid chainId");
        }

        console.log("totalSupply", totalSupply);
        const tokenByIndexMulticallRes = await publicClient.multicall({
            contracts: Array.from({ length: totalSupply }, (_, i) => i).map((index) => ({
                address: nftAddress as `0x${string}`,
                abi: erc721EnumerableAbi as any,
                functionName: "tokenByIndex",
                args: [index],
            })),
        });
        if (tokenByIndexMulticallRes.some(({ status }) => status === "failure")) {
            appendLog("Failed to fetch tokenIds");
            return false;
        }
        const tokenIds = tokenByIndexMulticallRes.map(({ result }: any) => result as ethers.BigNumber);
        appendLog("tokenIds fetched");

        const tokenURIMulticallRes = await publicClient.multicall({
            contracts: tokenIds.map((tokenId) => ({
                address: nftAddress as `0x${string}`,
                abi: erc721EnumerableAbi as any,
                functionName: "tokenURI",
                args: [tokenId],
            })),
        });

        if (tokenURIMulticallRes.some(({ status }) => status === "failure")) {
            appendLog("Failed to fetch tokenURIs");
            return false;
        }
        const tokenURIs = tokenURIMulticallRes.map(({ result }: any) => result as string);
        appendLog("TokenURIs fetched. Total number of tokens "+tokenURIs.length);

        const metadataList = await Promise.all(
            tokenURIs.map(async (uri) => {
                let fetchURL = uri;
                if (uri.startsWith("ipfs://")) {
                    const IPFS_GATEWAY = "https://ipfs.io/ipfs/";
                    fetchURL = IPFS_GATEWAY + uri.substring(7);
                }
                try{
                    const response = await fetchWithTimeout(fetchURL);
                    if (!response.ok) {
                        appendLog(`Failed to fetch token data from URI: ${uri}`);
                        return {};
                    }
                    appendLog("Metadata fetched from URI: " + fetchURL);
                    return await response.json();
                } catch (error) {
                    appendLog(`Failed to fetch token data from URI: ${uri}`);
                    return {};
                }
            }),
        );
        const nftData = tokenIds.map((tokenId, i) => ({
            tokenId: tokenId.toString(),
            metadata: metadataList[i],
        }));
        appendLog("NFT images fetched");
        setNftData(nftData);
    } 