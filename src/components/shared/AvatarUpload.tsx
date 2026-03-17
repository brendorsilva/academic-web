import { useState, useRef } from "react";
import { Camera } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AvatarUploadProps {
  currentImage?: string;
  name: string;
  onFileSelect: (file: File) => void;
}

export function AvatarUpload({ currentImage, name, onFileSelect }: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | undefined>(currentImage);
  const inputRef = useRef<HTMLInputElement>(null);

  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  return (
    <div
      className="relative group cursor-pointer w-fit"
      onClick={() => inputRef.current?.click()}
    >
      <Avatar className="h-24 w-24 border-2 border-border">
        <AvatarImage src={preview} alt={name} />
        <AvatarFallback className="text-lg font-medium bg-muted text-muted-foreground">
          {initials || "?"}
        </AvatarFallback>
      </Avatar>
      <div className="absolute inset-0 rounded-full bg-foreground/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <Camera className="h-6 w-6 text-primary-foreground" />
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
