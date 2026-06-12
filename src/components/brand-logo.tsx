import logoColor from "@/assets/logo-color.png.asset.json";
import logoWhite from "@/assets/logo-white.png.asset.json";
import logoBlack from "@/assets/logo-black.png.asset.json";

type Variant = "color" | "white" | "black";

const SRC: Record<Variant, string> = {
  color: logoColor.url,
  white: logoWhite.url,
  black: logoBlack.url,
};

export function BrandLogo({
  variant = "color",
  className = "",
  alt = "نخبة تسكين العقارية",
}: {
  variant?: Variant;
  className?: string;
  alt?: string;
}) {
  return <img src={SRC[variant]} alt={alt} className={className} loading="eager" />;
}
