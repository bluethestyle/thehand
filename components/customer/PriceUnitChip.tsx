import { formatPrice } from "@/lib/format";
import { BottleIcon, GlassIcon, TokkuriIcon } from "./icons";
import s from "./customer.module.css";

type Unit = "glass" | "tokkuri" | "bottle";

const META: Record<Unit, { label: string; ml: string; icon: React.ReactNode }> = {
  glass: { label: "잔술", ml: "100㎖", icon: <GlassIcon size={14} /> },
  tokkuri: { label: "도쿠리", ml: "300㎖", icon: <TokkuriIcon size={17} /> },
  bottle: { label: "보틀", ml: "720㎖", icon: <BottleIcon size={22} /> },
};

export function PriceUnitChip({
  unit,
  price,
}: {
  unit: Unit;
  price: number | null | undefined;
}) {
  const m = META[unit];
  const off = price === null || price === undefined;
  return (
    <div className={`${s.chip} ${off ? s.chipOff : ""}`}>
      <div className={s.chipIcon}>{m.icon}</div>
      <div className={s.chipUnit}>{m.label}</div>
      <div className={s.chipMl}>{m.ml}</div>
      <div className={s.chipPrice}>{formatPrice(price)}</div>
    </div>
  );
}
