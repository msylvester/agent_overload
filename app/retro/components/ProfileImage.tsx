import Image from "next/image";

interface ProfileImageProps {
  type: string;
}

export default function ProfileImage({ type }: ProfileImageProps) {
  const altText =
    type === "/dwarf.png"
      ? "Dwarf"
      : type === "/prince.png"
        ? "Prince"
        : type === "/dragon.png"
          ? "Dragon"
          : "Character";

  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative flex h-80 items-center justify-center border-[#6b6b6b] border-[3px] bg-[#171217] bg-[radial-gradient(circle_at_top,#172141_0%,#050509_80%)] p-1.5 shadow-[inset_0_0_0_2px_#2b2b2b] max-md:h-[260px]">
        <div className="relative flex h-full w-full max-w-[280px] items-center justify-center">
          <Image
            alt={altText}
            className="object-contain [filter:drop-shadow(0_0_20px_rgba(93,172,255,0.6))_drop-shadow(0_0_40px_rgba(125,205,255,0.4))]"
            fill
            sizes="(max-width: 768px) 100vw, 280px"
            src={type}
          />
        </div>
      </div>
    </div>
  );
}
