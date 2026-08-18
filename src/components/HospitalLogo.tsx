import logoAsset from "@/assets/logo.png.asset.json";

export function HospitalLogo({ className = "" }: { className?: string }) {
  return (
    <img
      src={logoAsset.url}
      alt="Darul Shifa General Hospital logo"
      className={`w-full max-w-md object-contain ${className}`}
    />
  );
}