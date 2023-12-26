import { ChangeEvent, useState, useEffect } from 'react';
import { useAccount, useNetwork } from 'wagmi';
import LoadingBar from './loading_bar';
import { uploadFiles } from './uploadManager';
import { useContract } from "@/hooks/useContract";
import { handleClickFetchNFTData } from './getNFTdata';
import { ERC721EnumerableInterfaceID, sampleNFTAddress } from '@/constants/other';

interface Metadata {
  [key: string]: any;
}

interface NFT {
  tokenId: string;
  metadata?: Metadata;
}

function getDefaultBucketName() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // JavaScript months are 0-based
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');

  return `bucket-${year}-${month}-${day}-${hours}-${minutes}`;
}

export const CreateObject = ({ appendLog }) => {
  const [currentView, setCurrentView] = useState('nftFetch'); // 'nftFetch' or 'linksMigrator'
  const { address, connector } = useAccount();
  const { chain } = useNetwork();
  const [createObjectInfo, setCreateObjectInfo] = useState({
    bucketName: getDefaultBucketName(),
  });
  // const ipfs = ipfsClient("https://gateway.ipfs.io/");
  const [linkInfo, setLinkInfo] = useState({
    links: [],
  });
  const [progress, setProgress] = useState(0);
  const [chainId, setChainId] = useState(56);
  const [nftData, setNftData] = useState<NFT[]>([]);
  const [nftAddress, setNFTAddress] = useState(sampleNFTAddress);
  const { erc165, erc721Enumerable } = useContract({ chainId, address: nftAddress });
  useEffect(() => {
    if (nftData.length > 0) {
      const nftLinks = nftData.map(nft => nft.metadata.image).filter(link => link);
      appendLog("Populated links for migration")
      setLinkInfo({ links: nftLinks });
      setCurrentView('linksMigrator');
    }
  }, [nftData]);
  return (
    <div>
      <div className="mb-6 flex justify-end items-center">
        <nav className="flex space-x-4 text-gray-600">
          <button
            className={`px-4 py-2 font-semibold border-b-2 ${currentView === 'nftFetch' ? 'text-green-600 border-green-600' : 'text-gray-600 border-gray-600 opacity-25'}`}
            onClick={() => setCurrentView('nftFetch')}
          >
            NFT Fetch
          </button>
          <button
            className={`px-4 py-2 font-semibold border-b-2 ${currentView === 'linksMigrator' ? 'text-green-600 border-green-600' : 'text-gray-600 border-gray-600 opacity-25'}`}
            onClick={() => setCurrentView('linksMigrator')}
          >
            Links Migrator
          </button>
        </nav>
      </div>
      {currentView === 'nftFetch' && (
        <>
          <label htmlFor="network" className="block font-medium text-gray-600">
            NFT Network
          </label>
          <select
            id="chainId"
            className="bg-white text-gray-600 p-2 w-full rounded-lg border-2 border-gray-300 focus:border-gray-400 outline-none input-form"
            value={chainId}
            style={{ width: '100%', marginBottom: 5 }}
            onChange={(e) => setChainId(Number(e.target.value))}
          >
            <option value={56}>BSC</option>
            <option value={204}>opBNB</option>
            <option value={97}>BSC Testnet</option>
            <option value={5611}>opBNB Testnet</option>
            
          </select>
          
              <label htmlFor="address" className="block font-medium text-gray-600">
                NFT Contract Address
              </label>
              <input
                id="address"
                className="p-2 bg-white text-gray-600 rounded-lg border border-gray-300 w-full md:w-1/2 lg:w-1/3"
                type="text"
                style={{ width: '100%', marginBottom: 5 }}
                placeholder="Enter NFT Contract Address"
                value={nftAddress}
                onChange={(e) => setNFTAddress(e.target.value)}
              />
          <br />
          <button className="bg-green-600 px-4 py-2 text-white hover:bg-green-500 sm:px-8 sm:py-3 rounded-lg w-full"
            onClick={async () => {
              await handleClickFetchNFTData(chainId, nftAddress, erc165, erc721Enumerable, ERC721EnumerableInterfaceID, setNftData, appendLog);
            }}
          >
            fetch nft
          </button>
        </>
      )}

      {currentView === 'linksMigrator' && (
        <>
          <h4 className="block font-medium text-gray-600" >Bucket name:</h4>
          <input className="p-2 bg-white text-gray-600 rounded-lg border border-gray-300 w-full md:w-1/2 lg:w-1/3"
            value={createObjectInfo.bucketName}
            style={{ width: '100%', marginBottom: 5 }}
            placeholder="bucket name"
            onChange={(e) => {
              setCreateObjectInfo({ ...createObjectInfo, bucketName: e.target.value });
            }}
          />
          <br />
          <h4 className="block font-medium text-gray-600">Input IPFS/Arweave links:</h4>
          <textarea
            className=" h-[100px] overflow-y-auto p-4 bg-white text-gray-600 rounded-lg border border-gray-300 w-full md:w-1/2 lg:w-1/3"
            value={linkInfo.links.join('\n')}
            placeholder="links separated by newline"
            style={{ width: '100%', marginBottom: 5 }}
            onChange={(e) => {
              const newLinks = e.target.value.split('\n');
              setLinkInfo({ ...linkInfo, links: newLinks });
            }}
          />
          <br />
          <button className="bg-green-600 px-4 py-2 text-white hover:bg-green-500 sm:px-8 sm:py-3 rounded-lg w-full" style={{ marginBottom: 5 }}
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
                await uploadFiles(singleLink, createObjectInfo, appendLog, setProgress, connector, address, chain);
              }
            }}
          >
            Migrate objects
          </button>
          <div>
            <LoadingBar progress={progress} />
          </div>
        </>
      )}

    </div>
  );
};
