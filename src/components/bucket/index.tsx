import { CreateBucket } from './create';

export const Bucket = ({ appendLog }) => {
  return (
    <div>
      <h2 class="text-3xl font-bold ">Create Bucket</h2>
      <CreateBucket appendLog={appendLog} />

    </div>
  );
};
