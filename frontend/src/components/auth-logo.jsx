import { Icon } from "@/components/icon";
export function AuthLogo({ variant = "default", }) {
    const inverse = variant === "inverse";
    const compact = variant === "compact";
    return (<>
      <Icon name="brand" size={compact ? 40 : inverse ? 48 : 52} 
    // Keep the header's house/door artwork legible in the white version.
    className={inverse ? "text-white [&_[stroke=white]]:stroke-primary" : "text-primary"}/>
      <span className="shrink-0">
        <span className={`block leading-tight font-bold tracking-[-0.02em] ${compact ? "text-xl" : inverse ? "text-[25px]" : "text-[26px]"} ${inverse ? "text-white" : "text-[#171044]"}`}>
          RoomStay
        </span>
        <span className={`mt-0.5 block ${compact ? "text-[10px]" : "text-xs"} ${inverse ? "text-white/80" : "text-[#52516a]"}`}>
          Find. Rent. Belong.
        </span>
      </span>
    </>);
}
