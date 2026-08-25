import { Plane, ShieldCheck, Wallet, LineChart } from "lucide-react";
import { Logo } from "@/components/ui/logo";

const POINTS = [
  { icon: Plane, text: "Competitive fares from the connected supplier network" },
  { icon: Wallet, text: "Secure prepaid ExpertzWallet built for booking flights" },
  { icon: LineChart, text: "Transparent earnings on every booking" },
  { icon: ShieldCheck, text: "Wallet held before booking — debited only on a confirmed ticket" },
];

export function AuthAside() {
  return (
    <div className="relative hidden overflow-hidden navy-wash lg:flex lg:flex-col lg:justify-between lg:p-10">
      <Logo size="md" href="/" onDark />
      <div>
        <span className="eyebrow text-orange">
          <span className="h-1.5 w-1.5 rounded-full bg-orange" />
          India&apos;s Smarter B2B Flight Platform
        </span>
        <h2 className="mt-4 text-3xl font-extrabold leading-tight text-white">
          Better flights. More earnings. Stronger business.
        </h2>
        <ul className="mt-8 space-y-4">
          {POINTS.map((p) => (
            <li key={p.text} className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/10 text-white">
                <p.icon size={17} />
              </span>
              <span className="pt-1.5 text-sm font-semibold text-blue-100">{p.text}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="text-xs text-blue-100/70">
        © {new Date().getFullYear()} ExpertzTrip · A B2B travel technology platform
      </p>
    </div>
  );
}
