type Props = {
  title: string;
  subtitle: string;
};


export default function Header({ title, subtitle }: Props) {
  return (
    <div className="mb-6">
      <h2 className="text-3xl font-bold text-slate-800">{title}</h2>
      <p className="text-slate-500 mt-1">{subtitle}</p>
    </div>
  );
}
