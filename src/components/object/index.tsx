import { CreateObject } from './create';

export const ObjectComponent = ({ appendLog }) => {
  return (
    <>
      <h2 className="text-3xl font-bold ">Migrate object from IPFS, Arweave</h2>
      <CreateObject appendLog={appendLog} />

    </>
  );
};
