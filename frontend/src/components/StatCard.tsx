type Props = {
  label: string;
  value: number;
};


export default function StatCard({ label, value }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-5">
      <p className="text-slate-500 text-sm">{label}</p>
      <h3 className="text-3xl font-bold text-slate-800 mt-2">{value}</h3>
    </div>
  );
}
