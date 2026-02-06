'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { bannerService } from '@/services/api';
import styles from './HeroSlider.module.scss';

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  image: string;
  backgroundColor: string;
}

interface HeroSliderProps {
  slides?: Slide[];
  autoPlay?: boolean;
  interval?: number;
}

const defaultSlides: Slide[] = [
  {
    id: 1,
    title: 'MEGA BAZAR',
    subtitle: 'Até 70% OFF em peças selecionadas',
    buttonText: 'Ver Ofertas',
    buttonLink: '/promocoes',
    image: '/images/banner1.jpg',
    backgroundColor: '#0C1C3A',
  },
  {
    id: 2,
    title: 'NOVA COLEÇÃO',
    subtitle: 'Primavera/Verão 2026',
    buttonText: 'Conferir',
    buttonLink: '/produtos',
    image: '/images/banner2.jpg',
    backgroundColor: '#0C1C3A',
  },
  {
    id: 3,
    title: 'FRETE GRÁTIS',
    subtitle: 'Em compras acima de R$ 200',
    buttonText: 'Aproveitar',
    buttonLink: '/produtos',
    image: '/images/banner3.jpg',
    backgroundColor: '#1a2a4a',
  },
];

export default function HeroSlider({ 
  slides: customSlides,
  autoPlay = true, 
  interval = 5000 
}: HeroSliderProps) {
  const [slides, setSlides] = useState<Slide[]>(customSlides || defaultSlides);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [loading, setLoading] = useState(!customSlides);

  // Buscar banners da API se não foram fornecidos
  useEffect(() => {
    if (!customSlides) {
      carregarBanners();
    }
  }, [customSlides]);

  const carregarBanners = async () => {
    try {
      setLoading(true);
      const response = await bannerService.getAll(true); // Apenas banners ativos
      
      if (response.success && response.data && response.data.length > 0) {
        // Converter formato do banco para formato do componente
        const bannersFormatados = response.data.map((banner: any) => ({
          id: banner.id,
          title: banner.titulo,
          subtitle: banner.subtitulo || '',
          buttonText: banner.texto_botao || 'Ver Mais',
          buttonLink: banner.link_botao || '/produtos',
          image: banner.imagem || '',
          backgroundColor: banner.cor_fundo || '#0C1C3A',
        }));
        
        setSlides(bannersFormatados);
      } else {
        // Se não houver banners, usar os padrão
        setSlides(defaultSlides);
      }
    } catch (error) {
      console.error('Erro ao carregar banners:', error);
      // Em caso de erro, usar banners padrão
      setSlides(defaultSlides);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!autoPlay || slides.length === 0) return;

    const timer = setInterval(() => {
      nextSlide();
    }, interval);

    return () => clearInterval(timer);
  }, [currentSlide, autoPlay, interval, slides.length]);

  const nextSlide = () => {
    if (isAnimating || slides.length === 0) return;
    setIsAnimating(true);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const prevSlide = () => {
    if (isAnimating || slides.length === 0) return;
    setIsAnimating(true);
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const goToSlide = (index: number) => {
    if (isAnimating || index === currentSlide || slides.length === 0) return;
    setIsAnimating(true);
    setCurrentSlide(index);
    setTimeout(() => setIsAnimating(false), 500);
  };

  if (loading) {
    return (
      <div className={styles.heroSlider} style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
      </div>
    );
  }

  if (slides.length === 0) {
    return null;
  }

  return (
    <div className={styles.heroSlider}>
      <div className={styles.slidesContainer}>
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`${styles.slide} ${index === currentSlide ? styles.active : ''}`}
            style={{ backgroundColor: slide.backgroundColor }}
          >
            <div className={styles.slideContent}>
              <div className={styles.textContent}>
                <h1 className={styles.title}>{slide.title}</h1>
                <p className={styles.subtitle}>{slide.subtitle}</p>
                <Link href={slide.buttonLink}>
                  <button className={styles.ctaButton}>{slide.buttonText}</button>
                </Link>
              </div>
              
              {slide.image && (
                <div className={styles.imageContent}>
                  <div 
                    className={styles.slideImage}
                    style={{ backgroundImage: `url(${slide.image})` }}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Controles */}
      {slides.length > 1 && (
        <>
          <button 
            className={`${styles.navButton} ${styles.prev}`}
            onClick={prevSlide}
            aria-label="Slide anterior"
          >
            <FiChevronLeft />
          </button>

          <button 
            className={`${styles.navButton} ${styles.next}`}
            onClick={nextSlide}
            aria-label="Próximo slide"
          >
            <FiChevronRight />
          </button>

          {/* Indicadores */}
          <div className={styles.indicators}>
            {slides.map((_, index) => (
              <button
                key={index}
                className={`${styles.indicator} ${index === currentSlide ? styles.active : ''}`}
                onClick={() => goToSlide(index)}
                aria-label={`Ir para slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
