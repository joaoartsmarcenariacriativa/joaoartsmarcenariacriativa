import { useState, useRef, useCallback } from 'react';
import { Upload, X, Loader2, ImageIcon, Video, Play } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  label?: string;
  maxImages?: number;
  acceptVideos?: boolean;
  bucket?: string;
  folder?: string;
  maxVideoSizeMB?: number;
}

const isVideoUrl = (url: string) =>
  /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url);

export default function ImageUploader({
  images,
  onChange,
  label = 'Fotos do Produto',
  maxImages = 8,
  acceptVideos = false,
  bucket = 'product-images',
  folder = 'products',
  maxVideoSizeMB = 50,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = maxImages - images.length;
    if (remaining <= 0) return;

    const toUpload = Array.from(files).slice(0, remaining);
    setUploading(true);
    setUploadError(null);

    const uploadedUrls: string[] = [];
    let failedCount = 0;

    for (const file of toUpload) {
      const isImage = file.type.startsWith('image/');
      const isVideo = acceptVideos && file.type.startsWith('video/');

      if (!isImage && !isVideo) {
        failedCount++;
        continue;
      }
      if (isImage && file.size > 5 * 1024 * 1024) {
        setUploadError(`Imagem "${file.name}" excede 5MB e foi ignorada.`);
        failedCount++;
        continue;
      }
      if (isVideo && file.size > maxVideoSizeMB * 1024 * 1024) {
        setUploadError(`Vídeo "${file.name}" excede ${maxVideoSizeMB}MB e foi ignorado.`);
        failedCount++;
        continue;
      }

      const fileExt = file.name.split('.').pop()?.toLowerCase() ?? (isVideo ? 'mp4' : 'jpg');
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (!upErr) {
        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);
        uploadedUrls.push(urlData.publicUrl);
      }
    }

    if (uploadedUrls.length > 0) {
      onChange([...images, ...uploadedUrls]);
    }
    if (failedCount > 0 && !uploadError) {
      setUploadError(`${failedCount} arquivo(s) ignorado(s) por formato inválido.`);
    }
    setUploading(false);
  }, [images, onChange, maxImages, uploadError, acceptVideos, bucket, folder, maxVideoSizeMB]);

  const handleRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  const handleMoveLeft = (index: number) => {
    if (index === 0) return;
    const newImages = [...images];
    [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
    onChange(newImages);
  };

  const handleMoveRight = (index: number) => {
    if (index === images.length - 1) return;
    const newImages = [...images];
    [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
    onChange(newImages);
  };

  return (
    <div>
      <label className="text-[11px] uppercase tracking-[0.15em] text-muted">{label}</label>
      <p className="text-[11px] text-muted mt-0.5 mb-2">
        Arraste ou clique para selecionar. A primeira mídia será a capa. Máx {maxImages} arquivos.
        {acceptVideos && ' Vídeos até ' + maxVideoSizeMB + 'MB.'}
      </p>
      {uploadError && (
        <p className="text-[11px] text-red-600 mb-2">{uploadError}</p>
      )}

      {/* Upload zone */}
      {images.length < maxImages && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => {
            e.preventDefault();
            setDragOver(false);
            handleFiles(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
            dragOver
              ? 'border-wood bg-wood/10'
              : 'border-rim hover:border-wood/50 hover:bg-cream'
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 text-wood animate-spin" />
              <p className="text-sm text-muted">Enviando...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 bg-wood/10 rounded-full flex items-center justify-center">
                <Upload className="w-5 h-5 text-wood" />
              </div>
              <p className="text-sm text-espresso font-medium">
                Clique ou arraste {acceptVideos ? 'fotos e vídeos' : 'fotos'} aqui
              </p>
              <p className="text-[10px] uppercase tracking-[0.08em] text-muted">
                {acceptVideos ? 'JPG, PNG, WebP até 5MB • MP4, WebM até ' + maxVideoSizeMB + 'MB' : 'JPG, PNG ou WebP até 5MB'}
              </p>
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept={acceptVideos ? 'image/*,video/*' : 'image/*'}
            multiple
            className="hidden"
            onChange={e => handleFiles(e.target.files)}
          />
        </div>
      )}

      {/* Previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
          {images.map((img, idx) => {
            const video = isVideoUrl(img);
            return (
              <div
                key={idx}
                className="relative group aspect-square rounded-lg overflow-hidden border border-rim bg-cream"
              >
                {video ? (
                  <div className="relative w-full h-full bg-espresso flex items-center justify-center">
                    <video src={img} className="w-full h-full object-cover" preload="metadata" muted />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-8 h-8 bg-paper/90 rounded-full flex items-center justify-center">
                        <Play className="w-4 h-4 text-espresso ml-0.5" />
                      </div>
                    </div>
                    <span className="absolute top-1 right-1 text-[8px] font-bold uppercase tracking-wide px-1 py-0.5 bg-espresso text-cream rounded">
                      Vídeo
                    </span>
                  </div>
                ) : (
                  <img src={img} alt={`Mídia ${idx + 1}`} className="w-full h-full object-cover" />
                )}

                {/* Cap badge */}
                {idx === 0 && (
                  <span className="absolute top-1 left-1 text-[9px] font-bold uppercase tracking-[0.08em] px-1.5 py-0.5 bg-wood text-cream rounded">
                    CAPA
                  </span>
                )}

                {/* Controls overlay */}
                <div className="absolute inset-0 bg-espresso/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                  <button
                    onClick={e => { e.stopPropagation(); handleMoveLeft(idx); }}
                    disabled={idx === 0}
                    className="p-1 bg-paper/90 rounded text-espresso hover:bg-paper disabled:opacity-30"
                    title="Mover para esquerda"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); handleMoveRight(idx); }}
                    disabled={idx === images.length - 1}
                    className="p-1 bg-paper/90 rounded text-espresso hover:bg-paper disabled:opacity-30"
                    title="Mover para direita"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); handleRemove(idx); }}
                    className="p-1 bg-red-500 rounded text-white hover:bg-red-600"
                    title="Remover"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Add more placeholder */}
          {images.length < maxImages && (
            <button
              onClick={() => inputRef.current?.click()}
              className="aspect-square rounded-lg border-2 border-dashed border-rim hover:border-wood/50 flex items-center justify-center transition-colors"
            >
              {acceptVideos ? <Video className="w-5 h-5 text-muted" /> : <ImageIcon className="w-5 h-5 text-muted" />}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
