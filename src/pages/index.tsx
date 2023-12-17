import { Bucket } from '@/components/bucket';
import { ObjectComponent } from '@/components/object';
import { WalletInfo } from '@/components/walletInfo';
import { useIsMounted } from '@/hooks/useIsMounted';
import { useAccount } from 'wagmi';
import React, { useState, useEffect, useRef  } from 'react';
// import { DownloaderComponent } from '@/components/downloader';

export default function Home() {
  const isMounted = useIsMounted();
  const { isConnected } = useAccount();
  const [logs, setLogs] = useState([]);
  const logEndRef = useRef(null);
  const appendLog = (message, isLink = false) => {
    setLogs((prevLogs) => [...prevLogs, { message, isLink }]);
  };
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollTop = logEndRef.current.scrollHeight;
    }
  }, [logs]);
  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-zinc-200">
    <div className="grid grid-flow-col grid-rows-4 grid-cols-5 gap-8">
      <div className="row-start-1 col-start-2 self-end ">
      
        {/* <img src="/logo.png" alt="Logo" class="h-auto w-1/2"/> */}
        
      </div>
      <div className="row-start-1 col-start-3 col-span-2 self-end ">
      <WalletInfo />
      </div>
      {isConnected && (
        <>
          <div className="row-start-2 col-start-2 col-span-1 bg-white rounded-lg shadow-lg p-4">
          <Bucket appendLog={appendLog} />
          </div>
          <div className="row-start-2 col-start-3 col-span-2 bg-white rounded-lg shadow-lg p-4">
          <ObjectComponent appendLog={appendLog} />
          </div>
          </>
      )}
      <div  ref={logEndRef} className="row-start-3 col-start-2 col-span-3 bg-white rounded-lg shadow-lg p-4" style={{ height: '200px', overflowY: 'scroll' }}>
      <h4>Logs :</h4>
      {logs.map((log, index) => (
          <div key={index}>
            {log.isLink ? (
              <a href={log.message} target="_blank" rel="noopener noreferrer" className="underline">
                {log.message}
              </a>
            ) : (
              log.message
            )}
          </div>
        ))}
      </div>
    </div>
    </div>
  );
}
