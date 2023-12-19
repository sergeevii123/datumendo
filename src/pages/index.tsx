import { Bucket } from '@/components/bucket';
import { ObjectComponent } from '@/components/object';
import { WalletInfo } from '@/components/walletInfo';
import { useIsMounted } from '@/hooks/useIsMounted';
import { useAccount } from 'wagmi';
import React, { useState, useEffect, useRef } from 'react';
import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"] });

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
    <main
      className={`${inter.className} min-h-screen flex flex-col bg-gradient-to-br from-green-400 to-gray-100 p-3`}
    >
      <header className="flex justify-between items-center mb-8 px-4 py-2 bg-gray-100 rounded-lg shadow-md bg-sub">
        <h1 className="header-logo">Datumendo</h1>
        <WalletInfo />
      </header>
        <>
        <div className="max-w-4xl w-full mx-auto p-4 bg-gray-100 rounded-lg shadow-md mb-8 bg-sub">
            <Bucket appendLog={appendLog} />
          </div>
          <div className="max-w-4xl w-full mx-auto p-4 bg-gray-100 rounded-lg shadow-md mb-8 bg-sub">
            <ObjectComponent appendLog={appendLog} />
          </div>
        </>
      <div ref={logEndRef} className="max-w-4xl w-full mx-auto p-4 bg-gray-100 rounded-lg shadow-md mb-8 bg-sub" style={{ height: '200px', overflowY: 'scroll' }}>
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
    </main>
  );
}
