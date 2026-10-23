import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Banner } from '@/types';

interface HeroBannerProps {
  onNavigate: (path: string) => void;
}

export default function HeroBanner({ onNavigate }: HeroBannerProps) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    supabase
      .from('banners')
      .select('*')
      .eq('active', true)
      .order('sort_order')
      .then(({ data }) => setBanners(data as Banner[] ?? []));
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent(c => (c + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (banners.length === 0) return null;

  const goNext = () => setCurrent(c => (c + 1) % banners.length);
  const goPrev = () => setCurrent(c => (c - 1 + banners.length) % banners.length);

  return (
    <div className="relative w-full h-[320px] sm:h-[460px] lg:h-[560px] rounded-2xl overflow-hidden bg-espresso shadow-lift">
      {banners.map((banner, idx) => (
        <div
          key={banner.id}
          className={`absolute inset-0 transition-opacity duration-700 ${
            idx === current ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <img
            src={banner.image_url}
            alt={banner.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-espresso/85 via-espresso/40 to-transparent" />
          <div className="absolute inset-0 flex items-center">
            <div className="max-w-xl px-6 sm:px-10 lg:px-16">
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-cream leading-[1.1]">
                {banner.title}
              </h2>
              {banner.subtitle && (
                <p className="mt-3 sm:mt-4 text-sm sm:text-lg text-cream/70 max-w-md leading-relaxed">
                  {banner.subtitle}
                </p>
              )}
              {banner.cta_text && (
                <button
                  onClick={() => onNavigate(banner.cta_link ?? '/produtos')}
                  className="mt-5 sm:mt-7 px-7 py-3 bg-wood hover:bg-wood-dark text-cream font-medium rounded-lg transition-colors text-sm sm:text-base"
                >
                  {banner.cta_text}
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      {banners.length > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-espresso/40 hover:bg-wood backdrop-blur rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-cream" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-espresso/40 hover:bg-wood backdrop-blur rounded-full transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-cream" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrent(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === current ? 'w-6 bg-wood' : 'w-2 bg-cream/40'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
