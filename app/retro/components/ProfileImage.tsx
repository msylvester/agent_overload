
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
      <div className="border-[3px] border-[#6b6b6b] bg-[#171217] shadow-[inset_0_0_0_2px_#2b2b2b] relative p-1.5 h-80 flex items-center justify-center bg-[radial-gradient(circle_at_top,#172141_0%,#050509_80%)] max-md:h-[260px]">
        <div className="relative w-full max-w-[280px] h-full flex items-center justify-center">
          <Image
            src={type}
            alt={altText}
            fill
            sizes="(max-width: 768px) 100vw, 280px"
            className="object-contain [filter:drop-shadow(0_0_20px_rgba(93,172,255,0.6))_drop-shadow(0_0_40px_rgba(125,205,255,0.4))]"
          />
        </div>
      </div>
    </div>
  );
}


