import { CreateBucket } from './create';

export const Bucket = ({ appendLog }) => {
  return (
    <div>
      <h2 className="text-3xl font-bold ">Create Bucket</h2>
      <CreateBucket appendLog={appendLog} />

    </div>
  );
};
