import { useState, useEffect, useRef, RefObject, lazy, Suspense } from "react";
import { 
  Check, 
  Shield, 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft,
  ChevronRight,
  X, 
  BookOpen, 
  Calendar, 
  Map, 
  Volume2, 
  HelpCircle, 
  Lock, 
  FileText,
  Maximize2
} from "lucide-react";

// Carregamento Preguiçoso (Lazy Loading) do SecureRedirects para otimizar o tamanho do bundle inicial do site
const SecureRedirects = lazy(() => import("./components/SecureRedirects"));

// ============================================================================
// CONFIGURAÇÃO EDITÁVEL
// ============================================================================
export const config = {
  basicPrice: "R$9,90",
  premiumPrice: "R$19,90",
  premiumUpsellPrice: "R$16,90",
  basicCheckoutUrl: "https://checkout.transacaoprotegida.com/c35942dc-4391-43d3-894d-753de3f8479e", // Plano 9,90 (Guia Essencial)
  premiumCheckoutUrl: "https://checkout.transacaoprotegida.com/90cc5cc5-fefb-4490-80ee-766fb52bad5a", // Plano 19,90 (Plano Completo)
  premiumUpsellCheckoutUrl: "https://checkout.transacaoprotegida.com/f595f38f-70c2-49dc-8ce0-77e09f37a68b", // Plano 16,90 (Upsell)
  guaranteeDays: 7,
  assets: {
    hero: "https://i.ibb.co/Lz9yrNrk/Hero.webp",
    testimonialWhatsapp1: "https://i.ibb.co/7JgsT6gf/Depoimentos-1.webp",
    testimonialWhatsapp2: "https://i.ibb.co/cKRdkvVf/Depoimentos-2.webp",
    testimonialWhatsapp3: "https://i.ibb.co/4nV47Snz/Depoimentos-3.webp",
    testimonialDirect1: "https://i.ibb.co/nv6p9GV/Depoimentos-4.webp",
    testimonialDirect2: "https://i.ibb.co/q3XfnTF1/Depoimentos-5.webp",

    bonusMapaMental: "https://i.ibb.co/WpcBtwrp/B-nus-1.webp",
    bonusReforco: "https://i.ibb.co/m5fMhTRM/B-nus-2.webp",
    bonusAudio: "https://i.ibb.co/20XNDqqY/B-nus-3.webp",
    bonusSituacoes: "https://i.ibb.co/bg5MhJ7q/B-nus-4.webp"
  }
};

// Auxiliar para disparar eventos do Facebook Pixel de forma segura
const trackPixel = (eventName: string, params?: Record<string, any>) => {
  try {
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("track", eventName, params);
      console.log(`[Pixel] Evento '${eventName}' enviado com sucesso.`, params);
    }
  } catch (err) {
    console.error("Falha ao enviar evento ao Facebook Pixel:", err);
  }
};

const trackCustomPixel = (eventName: string, params?: Record<string, any>) => {
  try {
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("trackCustom", eventName, params);
      console.log(`[Pixel Custom] Evento '${eventName}' enviado com sucesso.`, params);
    }
  } catch (err) {
    console.error("Falha ao enviar evento customizado ao Facebook Pixel:", err);
  }
};

// Auxiliar para anexar UTMs e parâmetros de rastreamento do UTMify de forma infalível
const addUtmsToUrl = (url: string): string => {
  if (!url) return url;
  try {
    const parsedUrl = new URL(url);
    const searchParams = new URLSearchParams(parsedUrl.search);

    // 1. Captura parâmetros diretamente da URL atual da página
    if (typeof window !== "undefined" && window.location) {
      const currentParams = new URLSearchParams(window.location.search);
      currentParams.forEach((value, key) => {
        searchParams.set(key, value);
      });
    }

    // 2. Chaves de rastreamento do UTMify e afins
    const utmKeys = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_content",
      "utm_term",
      "src",
      "xcod",
      "sck",
      "subid",
      "subid2",
      "subid3",
      "subid4",
      "subid5"
    ];

    // 3. Captura parâmetros salvos no localStorage (pelo UTMify)
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            const lowerKey = key.toLowerCase();
            if (
              lowerKey.startsWith("utm_") || 
              ["src", "xcod", "sck", "subid"].some(k => lowerKey.includes(k))
            ) {
              const val = localStorage.getItem(key);
              if (val && typeof val === "string" && val.length < 500) {
                searchParams.set(key, val);
              }
            }
          }
        }
      } catch (e) {
        // Ignora erros de localStorage
      }
    }

    // 4. Captura parâmetros salvos no sessionStorage
    if (typeof window !== "undefined" && window.sessionStorage) {
      try {
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key) {
            const lowerKey = key.toLowerCase();
            if (
              lowerKey.startsWith("utm_") || 
              ["src", "xcod", "sck", "subid"].some(k => lowerKey.includes(k))
            ) {
              const val = sessionStorage.getItem(key);
              if (val && typeof val === "string" && val.length < 500) {
                searchParams.set(key, val);
              }
            }
          }
        }
      } catch (e) {
        // Ignora erros de sessionStorage
      }
    }

    // 5. Captura parâmetros salvos em cookies (pelo UTMify)
    if (typeof document !== "undefined" && document.cookie) {
      try {
        const cookies = document.cookie.split(";");
        cookies.forEach((cookie) => {
          const [name, val] = cookie.split("=").map((c) => c.trim());
          if (name && val) {
            const lowerName = name.toLowerCase();
            if (
              lowerName.startsWith("utm_") || 
              ["src", "xcod", "sck", "subid"].some(k => lowerName.includes(k))
            ) {
              searchParams.set(name, decodeURIComponent(val));
            }
          }
        });
      } catch (e) {
        // Ignora erros de cookies
      }
    }

    parsedUrl.search = searchParams.toString();
    return parsedUrl.toString();
  } catch (err) {
    console.error("Erro ao anexar UTMs ao URL:", err);
    return url;
  }
};

export default function App() {
  const [sessionPage, setSessionPage] = useState<"landing" | "basic" | "premium" | "cancelled">("landing");
  const [isUpsellOpen, setIsUpsellOpen] = useState(false);
  const [activeFaqIndex, setActiveFaqIndex] = useState<number | null>(null);
  const [isPausaExpanded, setIsPausaExpanded] = useState(true);

  // Estados e Refs adicionais para Carrossel, Zoom de Imagem e Barra Flutuante de Compra
  const [showFloatingBar, setShowFloatingBar] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Monitora rolagem para exibir barra flutuante após alcançar a seção "O que você vai receber"
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleScroll = () => {
      const target = document.getElementById("o-que-voce-recebe");
      const planosTarget = document.getElementById("planos");
      if (target) {
        const rect = target.getBoundingClientRect();
        const hasPassedStart = rect.top <= window.innerHeight - 100;

        let hasReachedPlanos = false;
        if (planosTarget) {
          const planosRect = planosTarget.getBoundingClientRect();
          // Esconde a barra flutuante se a seção de planos estiver visível ou o usuário já passou dela
          hasReachedPlanos = planosRect.top <= window.innerHeight - 50;
        }

        if (hasPassedStart && !hasReachedPlanos) {
          setShowFloatingBar(true);
        } else {
          setShowFloatingBar(false);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Execução inicial

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToHistorias = () => {
    const historiasSection = document.getElementById("historias");
    if (historiasSection) {
      historiasSection.scrollIntoView({ behavior: "smooth" });
      trackCustomPixel("HeroCtaClicked", { target: "historias" });
    }
  };

  const scrollToOQueVoceRecebe = () => {
    const targetSection = document.getElementById("o-que-voce-recebe");
    if (targetSection) {
      targetSection.scrollIntoView({ behavior: "smooth" });
      setShowFloatingBar(true);
      trackCustomPixel("CtaToReceiveClicked", { target: "o-que-voce-recebe" });
    }
  };

  const scrollCarousel = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const scrollAmount = window.innerWidth < 768 ? 260 : 340;
      carouselRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      });
      trackCustomPixel("CarouselScrolled", { direction });
    }
  };

  // Monitora parâmetros de URL para redirecionamentos seguros
  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const session = searchParams.get("session");
      if (session === "success_basic" || session === "pay_bsc_883017") {
        setSessionPage("basic");
      } else if (session === "success_premium" || session === "pay_prm_994821") {
        setSessionPage("premium");
      } else if (session === "cancelled" || session === "fail_912" || session === "expired") {
        setSessionPage("cancelled");
      }
    }
  }, []);

  const handleBackToPlans = () => {
    setSessionPage("landing");
    if (typeof window !== "undefined" && window.history) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    setTimeout(() => {
      const plansSection = document.getElementById("planos");
      if (plansSection) {
        plansSection.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };
  
  // Refs para acessibilidade do Modal de Upsell (Focus trapping)
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const acceptButtonRef = useRef<HTMLButtonElement>(null);

  // Modais institucionais para o rodapé (para que os links sejam totalmente funcionais)
  const [activeFooterModal, setActiveFooterModal] = useState<"privacidade" | "termos" | "contato" | null>(null);
  const footerModalRef = useRef<HTMLDivElement>(null);

  // Inicializa visualização de página no Pixel
  useEffect(() => {
    trackPixel("PageView");
  }, []);

  // Bloqueia scroll do body ao abrir modais
  useEffect(() => {
    if (isUpsellOpen || activeFooterModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isUpsellOpen, activeFooterModal]);

  // Acessibilidade: fecha modal de Upsell com ESC e gerencia foco
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isUpsellOpen) {
          closeUpsell();
        }
        if (activeFooterModal) {
          setActiveFooterModal(null);
        }
      }

      // Prevenir tabulação de vazar para fora do modal de Upsell se ele estiver aberto
      if (isUpsellOpen && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.key === "Tab") {
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              lastElement.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === lastElement) {
              firstElement.focus();
              e.preventDefault();
            }
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isUpsellOpen, activeFooterModal]);

  const openUpsell = (btnRef: RefObject<HTMLButtonElement | null>) => {
    setIsUpsellOpen(true);
    trackPixel("InitiateCheckout", {
      content_name: "Guia Essencial",
      value: 9.90,
      currency: "BRL"
    });
    trackCustomPixel("OpenUpsellModal", { offer: "Guia Essencial -> Upgrade" });
    
    // Foca o modal com um pequeno delay para garantir renderização do DOM
    setTimeout(() => {
      if (acceptButtonRef.current) {
        acceptButtonRef.current.focus();
      } else if (modalRef.current) {
        modalRef.current.focus();
      }
    }, 50);
  };

  const closeUpsell = () => {
    setIsUpsellOpen(false);
    trackCustomPixel("DeclineUpsellWithClose", { source: "modal_close_action" });
    if (triggerButtonRef.current) {
      triggerButtonRef.current.focus();
    }
  };

  const handleAcceptUpgrade = () => {
    trackPixel("Purchase", {
      content_name: "Plano Completo (Upsell)",
      value: 16.90,
      currency: "BRL"
    });
    trackCustomPixel("AcceptUpgrade", { price: 16.90 });
    window.location.href = addUtmsToUrl(config.premiumUpsellCheckoutUrl);
  };

  const handleDeclineUpgrade = () => {
    trackPixel("Purchase", {
      content_name: "Guia Essencial",
      value: 9.90,
      currency: "BRL"
    });
    trackCustomPixel("DeclineUpgrade", { price: 9.90 });
    window.location.href = addUtmsToUrl(config.basicCheckoutUrl);
  };

  const handleBuyBasicDirectly = () => {
    trackPixel("InitiateCheckout", {
      content_name: "Guia Essencial (Direto)",
      value: 9.90,
      currency: "BRL"
    });
    trackCustomPixel("BuyBasicDirect", { price: 9.90 });
    window.location.href = addUtmsToUrl(config.basicCheckoutUrl);
  };

  const handleBuyPremiumDirectly = () => {
    trackPixel("InitiateCheckout", {
      content_name: "Plano Completo (Direto)",
      value: 19.90,
      currency: "BRL"
    });
    trackCustomPixel("BuyPremiumDirect", { price: 19.90 });
    window.location.href = addUtmsToUrl(config.premiumCheckoutUrl);
  };

  const scrollToPlanos = () => {
    const plansSection = document.getElementById("planos");
    if (plansSection) {
      plansSection.scrollIntoView({ behavior: "smooth" });
      trackCustomPixel("HeroCtaClicked", { target: "planos" });
    }
  };

  const toggleFaq = (index: number) => {
    setActiveFaqIndex(activeFaqIndex === index ? null : index);
    trackCustomPixel("FaqToggled", { questionIndex: index, state: activeFaqIndex === index ? "closed" : "opened" });
  };

  if (sessionPage !== "landing") {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-sand flex flex-col items-center justify-center p-4 font-sans select-none text-navy">
          <div className="text-sm font-semibold uppercase tracking-wider animate-pulse">Carregando página de segurança...</div>
        </div>
      }>
        <SecureRedirects 
          type={sessionPage} 
          onBackToPlans={handleBackToPlans} 
        />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans bg-sand text-navy selection:bg-burnt selection:text-white">
      
      {/* ──────────────────────────────────────────────────────── */}
      {/* BARRA SUPERIOR — FINÍSSIMA */}
      {/* ──────────────────────────────────────────────────────── */}
      <div className="w-full bg-navy text-cream text-[10px] min-[390px]:text-xs tracking-widest font-semibold py-2.5 px-4 text-center select-none uppercase">
        ACESSO IMEDIATO • PAGAMENTO ÚNICO • GARANTIA DE 7 DIAS
      </div>

      {/* ──────────────────────────────────────────────────────── */}
      {/* 1. HERO — PRIMEIRA DOBRA */}
      {/* ──────────────────────────────────────────────────────── */}
      <header className="relative w-full max-w-7xl mx-auto px-4 py-6 min-[390px]:py-8 md:py-16 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
        
        {/* Lado esquerdo (Desktop) ou Topo (Mobile) */}
        <div className="md:col-span-7 flex flex-col items-start text-left space-y-4 min-[390px]:space-y-5">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-burnt/10 border border-burnt/15 text-burnt text-[11px] min-[390px]:text-xs font-bold tracking-widest uppercase">
            Método PAUSA
          </div>
          
          <h1 className="text-xl min-[360px]:text-[1.35rem] min-[390px]:text-[1.65rem] min-[430px]:text-[1.85rem] md:text-4xl lg:text-5xl font-display font-bold text-navy leading-tight tracking-tight">
            Você já perdeu 6 meses dizendo <span className="text-burnt">“sim”</span> para não decepcionar os outros. Vai perder os próximos 6 <span className="text-burnt">se abandonando</span> também?
          </h1>
          
          <p className="text-xs min-[390px]:text-sm md:text-base text-slate-text leading-relaxed font-sans font-normal max-w-2xl">
            Um guia direto para recusar pedidos, impor limites e parar de se colocar por último — sem brigar, sem se explicar demais e sem voltar atrás por culpa. <strong className="text-burnt font-semibold underline decoration-burnt/25 underline-offset-4">Uma mudança real com técnicas práticas que você pode começar a aplicar ainda hoje!</strong>
          </p>

          {/* Versão Mobile: Imagem da Hero inserida exatamente após a Subheadline, garantindo que apareça na primeira dobra de 390x844px */}
          <div className="block md:hidden w-full">
            <div className="overflow-hidden rounded-xl border border-soft-border/60 bg-cream shadow-sm max-w-md mx-auto">
              <img 
                src={config.assets.hero} 
                alt="Banner Método PAUSA" 
                className="w-full h-auto aspect-[16/7] min-[390px]:max-h-[165px] object-cover"
                id="hero-image-mobile"
                loading="eager"
                fetchPriority="high"
                width="450"
                height="197"
              />
            </div>
          </div>

          <div className="w-full flex flex-col space-y-3 pt-1 md:pt-4 max-w-md">
            <button
              onClick={scrollToHistorias}
              id="cta-hero-primary"
              className="w-full bg-burnt text-white font-display font-bold text-[13px] min-[390px]:text-sm md:text-base tracking-wider uppercase py-4 px-6 rounded-lg hover:bg-burnt/95 active:scale-[0.98] transition-all duration-150 min-h-[52px] shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              VEJA COMO COMEÇAR A DIZER “NÃO” SEM CULPA
            </button>

            {/* Badges de Confiança */}
            <div className="flex items-center justify-center md:justify-start gap-4 text-[10px] min-[390px]:text-xs text-slate-text font-medium border-t border-soft-border/40 pt-3">
              <span className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-burnt shrink-0" />
                Acesso imediato
              </span>
              <span className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-burnt shrink-0" />
                Pagamento único
              </span>
              <span className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-burnt shrink-0" />
                Garantia de 7 dias
              </span>
            </div>

            <p className="text-[10px] min-[390px]:text-xs text-center md:text-left text-slate-text/90 italic leading-snug pt-1">
              Você não precisa se tornar uma pessoa fria. Só precisa parar de se abandonar para agradar os outros.
            </p>
          </div>
        </div>

        {/* Lado direito (Desktop) — Oculto no Mobile porque a imagem é injetada na hierarquia acima */}
        <div className="hidden md:block md:col-span-5">
          <div className="overflow-hidden rounded-xl border border-soft-border/60 bg-cream shadow-md transition-transform duration-300 hover:scale-[1.01]">
            <img 
              src={config.assets.hero} 
              alt="Método PAUSA Banner" 
              className="w-full h-auto object-cover aspect-[4/3] md:aspect-auto"
              id="hero-image-desktop"
              loading="eager"
              fetchPriority="high"
              width="512"
              height="384"
            />
          </div>
        </div>

      </header>

      {/* ──────────────────────────────────────────────────────── */}
      {/* 2. PROVA SOCIAL / SITUAÇÕES DO DIA A DIA */}
      {/* ──────────────────────────────────────────────────────── */}
      <section id="historias" className="w-full bg-cream py-12 md:py-20 border-y border-soft-border/50 scroll-mt-6">
        <div className="max-w-7xl mx-auto px-4">
          
          <div className="text-center max-w-3xl mx-auto mb-10 md:mb-16">
            <span className="text-[11px] font-bold uppercase tracking-widest text-burnt bg-burnt/10 px-3 py-1 rounded-full">
              SITUAÇÕES DO DIA A DIA
            </span>
            <h2 className="text-xl min-[390px]:text-2xl md:text-4xl font-display font-bold text-navy mt-4 leading-tight">
              VEJA COMO O MÉTODO PAUSA PODE SER APLICADO NA VIDA REAL
            </h2>
            <p className="text-xs min-[390px]:text-sm md:text-base text-slate-text mt-3">
              Pequenos limites podem mudar a forma como você trabalha, descansa e se posiciona.
            </p>
          </div>

          {/* Elegant Horizontal Carousel */}
          <div className="relative max-w-5xl mx-auto px-1 md:px-4 group/carousel">
            
            {/* Left Control Arrow (Desktop only) */}
            <button
              onClick={() => scrollCarousel("left")}
              className="hidden md:flex absolute -left-12 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-cream hover:bg-sand border border-soft-border/60 shadow-sm items-center justify-center text-navy hover:text-burnt active:scale-95 transition-all cursor-pointer z-20"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Carousel Container */}
            <div 
              ref={carouselRef}
              className="w-full overflow-x-auto flex gap-4 md:gap-6 snap-x snap-mandatory pb-5 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none]"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {[
                "https://i.ibb.co/cXgsQ863/Chat-GPT-Image-25-de-jun-de-2026-08-05-45-1.webp",
                "https://i.ibb.co/Sw1pmT9M/Chat-GPT-Image-25-de-jun-de-2026-08-05-45-2.webp",
                "https://i.ibb.co/jvRVP0sR/Chat-GPT-Image-25-de-jun-de-2026-08-05-45-3.webp",
                "https://i.ibb.co/hJpJYyBt/Chat-GPT-Image-25-de-jun-de-2026-08-05-46-4.webp",
                "https://i.ibb.co/vCyHYDWg/Chat-GPT-Image-25-de-jun-de-2026-08-05-46-5.webp",
                "https://i.ibb.co/Kx9WdzJg/Chat-GPT-Image-25-de-jun-de-2026-08-05-47-6.webp"
              ].map((imgUrl, idx) => (
                <div 
                  key={idx} 
                  className="w-[230px] min-[390px]:w-[265px] md:w-[285px] shrink-0 snap-start"
                >
                  <div 
                    onClick={() => setZoomedImage(imgUrl)}
                    className="relative aspect-[9/16] rounded-xl overflow-hidden border border-soft-border/60 bg-white shadow-sm hover:shadow-md hover:border-burnt/30 transition-all duration-300 cursor-zoom-in group/card"
                  >
                    <img 
                      src={imgUrl} 
                      alt={`Situação Real de Conversa ${idx + 1}`} 
                      className="w-full h-full object-cover pointer-events-none select-none transition-transform duration-300 group-hover/card:scale-[1.015]" 
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      width="285"
                      height="506"
                    />
                    
                    {/* Hover Overlay with expand icon */}
                    <div className="absolute inset-0 bg-navy/10 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="bg-cream/95 backdrop-blur-xs px-3.5 py-2 rounded-lg border border-soft-border/60 shadow-sm text-[10px] min-[390px]:text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-1.5 transform translate-y-2 group-hover/card:translate-y-0 transition-transform duration-200">
                        <Maximize2 className="w-3.5 h-3.5 text-burnt" /> Ampliar Conversa
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Control Arrow (Desktop only) */}
            <button
              onClick={() => scrollCarousel("right")}
              className="hidden md:flex absolute -right-12 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-cream hover:bg-sand border border-soft-border/60 shadow-sm items-center justify-center text-navy hover:text-burnt active:scale-95 transition-all cursor-pointer z-20"
              aria-label="Próximo"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Swipe indicator for mobile */}
          <p className="text-center text-[11px] text-slate-text/75 italic mt-3 md:hidden">
            Arraste para o lado para ver mais conversas
          </p>

          {/* CTA Button with Smooth Scroll Below Carousel */}
          <div className="text-center mt-10 md:mt-12 flex flex-col items-center">
            <button
              onClick={scrollToOQueVoceRecebe}
              className="bg-burnt text-white font-display font-bold text-[12px] min-[390px]:text-[13px] md:text-sm tracking-wider uppercase py-4 px-8 rounded-lg hover:bg-burnt/95 active:scale-[0.98] transition-all duration-150 shadow-md flex items-center gap-2 cursor-pointer"
            >
              VEJA O QUE VOCÊ VAI RECEBER
              <ChevronDown className="w-4 h-4 text-cream shrink-0" />
            </button>
          </div>

        </div>
      </section>

      {/* ──────────────────────────────────────────────────────── */}
      {/* 3. DETALHES DO PRODUTO / O QUE VOCÊ RECEBE */}
      {/* ──────────────────────────────────────────────────────── */}
      <section id="o-que-voce-recebe" className="w-full py-16 md:py-24 max-w-7xl mx-auto px-4 scroll-mt-6">
        
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <span className="text-[11px] font-bold uppercase tracking-widest text-burnt bg-burnt/10 px-3 py-1 rounded-full">
            MÉTODO COMPLETO
          </span>
          <h2 className="text-xl min-[390px]:text-2xl md:text-4xl font-display font-bold text-navy mt-4 leading-tight">
            O QUE É O MÉTODO PAUSA?
          </h2>
          <p className="text-xs min-[390px]:text-sm md:text-base text-slate-text mt-4 max-w-2xl mx-auto font-medium">
            Um guia prático para criar espaço entre o pedido de alguém e a sua resposta — sem brigar, sem se explicar demais e sem se abandonar por culpa.
          </p>
        </div>

        {/* Grid de 5 componentes - Altamente responsivo e polido, sem imagens */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          
          {/* CARD 1 — O MÉTODO PAUSA — DESTAQUE (ocupa 2 colunas no desktop) */}
          <div className="md:col-span-4 bg-cream rounded-xl p-6 border border-soft-border shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-burnt/10 text-burnt flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-burnt">Destaque Principal</span>
                  <h3 className="text-lg md:text-xl font-display font-bold text-navy">O MÉTODO PAUSA</h3>
                </div>
              </div>
              <p className="text-xs min-[390px]:text-sm text-slate-text leading-relaxed">
                Um passo a passo simples para sair do “sim” automático e responder com mais clareza.
              </p>

              {/* Expansão do Método PAUSA */}
              <div className="mt-4 border border-soft-border/80 rounded-lg bg-sand/30 overflow-hidden">
                <button
                  onClick={() => setIsPausaExpanded(!isPausaExpanded)}
                  className="w-full flex items-center justify-between p-3.5 text-left text-xs min-[390px]:text-sm font-semibold text-navy bg-sand/45 hover:bg-sand/60 transition-colors cursor-pointer"
                  aria-expanded={isPausaExpanded}
                >
                  <span>Conheça as etapas do Método PAUSA</span>
                  {isPausaExpanded ? <ChevronUp className="w-4 h-4 text-burnt" /> : <ChevronDown className="w-4 h-4 text-burnt" />}
                </button>
                
                {isPausaExpanded && (
                  <div className="p-4 space-y-3.5 border-t border-soft-border/60 font-sans text-xs min-[390px]:text-sm bg-cream/70">
                    <div className="flex items-start gap-2.5">
                      <span className="w-6 h-6 rounded-md bg-burnt text-white flex items-center justify-center font-bold text-xs shrink-0">P</span>
                      <p className="pt-0.5"><strong className="text-navy">PARE</strong> antes de responder.</p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-6 h-6 rounded-md bg-navy text-cream flex items-center justify-center font-bold text-xs shrink-0">A</span>
                      <p className="pt-0.5"><strong className="text-navy">AVALIE</strong> se isso realmente cabe na sua vida.</p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-6 h-6 rounded-md bg-burnt text-white flex items-center justify-center font-bold text-xs shrink-0">U</span>
                      <p className="pt-0.5"><strong className="text-navy">USE</strong> uma frase curta e clara.</p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-6 h-6 rounded-md bg-navy text-cream flex items-center justify-center font-bold text-xs shrink-0">S</span>
                      <p className="pt-0.5"><strong className="text-navy">SUSTENTE</strong> a sua decisão.</p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-6 h-6 rounded-md bg-burnt text-white flex items-center justify-center font-bold text-xs shrink-0">A</span>
                      <p className="pt-0.5"><strong className="text-navy">ACOLHA</strong> a culpa sem voltar atrás.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-soft-border/55">
              <p className="text-xs min-[390px]:text-sm font-serif italic text-burnt font-medium">
                Você não precisa decidir sob pressão.
              </p>
            </div>
          </div>

          {/* CARD 2 — FRASES PRONTAS */}
          <div className="md:col-span-2 bg-cream rounded-xl p-6 border border-soft-border shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-lg bg-burnt/10 text-burnt flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base min-[390px]:text-lg font-display font-bold text-navy">FRASES PRONTAS PARA DIZER NÃO</h3>
              <p className="text-xs min-[390px]:text-sm text-slate-text leading-relaxed">
                Respostas educadas e firmes para você se posicionar sem soar agressivo.
              </p>
            </div>
            <div className="mt-6 text-[11px] font-semibold text-burnt uppercase tracking-widest">
              Aplicações práticas
            </div>
          </div>

          {/* CARD 3 — COMO RECUSAR */}
          <div className="md:col-span-2 bg-cream rounded-xl p-6 border border-soft-border shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-lg bg-burnt/10 text-burnt flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base min-[390px]:text-lg font-display font-bold text-navy">COMO RECUSAR SEM SE EXPLICAR DEMAIS</h3>
              <p className="text-xs min-[390px]:text-sm text-slate-text leading-relaxed">
                Aprenda a recusar favores, convites, cobranças e pedidos sem justificar cada decisão.
              </p>
            </div>
            <div className="mt-6 text-[11px] font-semibold text-burnt uppercase tracking-widest">
              Livre de explicações
            </div>
          </div>

          {/* CARD 4 — MINI PLANO */}
          <div className="md:col-span-2 bg-cream rounded-xl p-6 border border-soft-border shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-lg bg-burnt/10 text-burnt flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-base min-[390px]:text-lg font-display font-bold text-navy">MINI PLANO DE 7 DIAS</h3>
              <p className="text-xs min-[390px]:text-sm text-slate-text leading-relaxed">
                Pequenos desafios para começar a treinar seus limites com mais consistência.
              </p>
            </div>
            <div className="mt-6 text-[11px] font-semibold text-burnt uppercase tracking-widest">
              Evolução diária
            </div>
          </div>

          {/* CARD 5 — CHECKLIST ANTES */}
          <div className="md:col-span-2 bg-cream rounded-xl p-6 border border-soft-border shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-lg bg-burnt/10 text-burnt flex items-center justify-center shrink-0">
                <Check className="w-5 h-5" />
              </div>
              <h3 className="text-base min-[390px]:text-lg font-display font-bold text-navy">CHECKLIST ANTES DE DIZER SIM</h3>
              <p className="text-xs min-[390px]:text-sm text-slate-text leading-relaxed">
                Descubra se você realmente quer aceitar ou se está apenas com medo de decepcionar alguém.
              </p>
            </div>
            <div className="mt-6 text-[11px] font-semibold text-burnt uppercase tracking-widest">
              Clareza mental
            </div>
          </div>

        </div>

        {/* Faixa de Destaque abaixo do grid */}
        <div className="mt-12 bg-cream border border-soft-border rounded-xl p-6 min-[390px]:p-8 text-center max-w-4xl mx-auto shadow-sm">
          <p className="text-sm min-[390px]:text-base md:text-lg text-navy font-medium leading-relaxed">
            Você não precisa mudar sua personalidade. Precisa aprender a se respeitar com mais clareza.
          </p>
        </div>

      </section>

      {/* ──────────────────────────────────────────────────────── */}
      {/* 4. BÔNUS EXCLUSIVOS — DIFERENTE VISUALMENTE (Fundo Escuro) */}
      {/* ──────────────────────────────────────────────────────── */}
      <section className="w-full bg-navy text-cream py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4">
          
          <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
            <div className="inline-block px-3 py-1 rounded bg-burnt text-white text-[10px] min-[390px]:text-xs font-bold tracking-widest uppercase mb-4">
              EXCLUSIVO DO PLANO COMPLETO
            </div>
            <h2 className="text-xl min-[390px]:text-2xl md:text-4xl font-display font-bold text-white leading-tight">
              Ferramentas extras para transformar limites em prática.
            </h2>
            <p className="text-xs min-[390px]:text-sm md:text-base text-cream/70 mt-3">
              Além do guia, você recebe materiais para reforçar suas decisões todos os dias.
            </p>
          </div>

          {/* Grid dos 4 Bônus com Imagens */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            
            {/* BÔNUS 1 */}
            <div className="bg-navy border border-cream/15 rounded-xl overflow-hidden flex flex-col justify-between group">
              <div>
                <div className="overflow-hidden bg-[#0d1622] relative">
                  <img 
                    src={config.assets.bonusMapaMental} 
                    alt="Mapa Mental de Dizer Não" 
                    className="w-full h-auto block transition-transform duration-300 group-hover:scale-[1.02]" 
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    width="464"
                    height="261"
                  />
                </div>
                <div className="p-5 md:p-6 space-y-2">
                  <h3 className="text-base min-[390px]:text-lg font-display font-bold text-white">
                    MAPA MENTAL DE DIZER NÃO
                  </h3>
                  <p className="text-xs min-[390px]:text-sm text-cream/75 leading-relaxed">
                    Um guia visual para saber o que fazer antes, durante e depois de uma conversa difícil.
                  </p>
                </div>
              </div>
              <div className="p-5 md:p-6 pt-0 border-t border-cream/10 text-[10px] font-bold text-cream/60 uppercase tracking-widest">
                INCLUSO NO PLANO COMPLETO
              </div>
            </div>

            {/* BÔNUS 2 */}
            <div className="bg-navy border border-cream/15 rounded-xl overflow-hidden flex flex-col justify-between group">
              <div>
                <div className="overflow-hidden bg-[#0d1622] relative">
                  <img 
                    src={config.assets.bonusReforco} 
                    alt="Roteiro de Reforço após dizer não" 
                    className="w-full h-auto block transition-transform duration-300 group-hover:scale-[1.02]" 
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    width="464"
                    height="261"
                  />
                </div>
                <div className="p-5 md:p-6 space-y-2">
                  <h3 className="text-base min-[390px]:text-lg font-display font-bold text-white">
                    ROTEIRO DE REFORÇO APÓS DIZER NÃO
                  </h3>
                  <p className="text-xs min-[390px]:text-sm text-cream/75 leading-relaxed">
                    Uma prática curta para não voltar atrás apenas para aliviar a culpa.
                  </p>
                </div>
              </div>
              <div className="p-5 md:p-6 pt-0 border-t border-cream/10 text-[10px] font-bold text-cream/60 uppercase tracking-widest">
                INCLUSO NO PLANO COMPLETO
              </div>
            </div>

            {/* BÔNUS 3 */}
            <div className="bg-navy border border-cream/15 rounded-xl overflow-hidden flex flex-col justify-between group">
              <div>
                <div className="overflow-hidden bg-[#0d1622] relative">
                  <img 
                    src={config.assets.bonusAudio} 
                    alt="Áudio Diário de Fortalecimento" 
                    className="w-full h-auto block transition-transform duration-300 group-hover:scale-[1.02]" 
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    width="464"
                    height="261"
                  />
                </div>
                <div className="p-5 md:p-6 space-y-2">
                  <h3 className="text-base min-[390px]:text-lg font-display font-bold text-white">
                    ÁUDIO DIÁRIO DE FORTALECIMENTO
                  </h3>
                  <p className="text-xs min-[390px]:text-sm text-cream/75 leading-relaxed">
                    Um áudio para ouvir pela manhã e reforçar firmeza, clareza e tranquilidade.
                  </p>
                </div>
              </div>
              <div className="p-5 md:p-6 pt-0 border-t border-cream/10 text-[10px] font-bold text-cream/60 uppercase tracking-widest">
                INCLUSO NO PLANO COMPLETO
              </div>
            </div>

            {/* BÔNUS 4 */}
            <div className="bg-navy border border-cream/15 rounded-xl overflow-hidden flex flex-col justify-between group">
              <div>
                <div className="overflow-hidden bg-[#0d1622] relative">
                  <img 
                    src={config.assets.bonusSituacoes} 
                    alt="25 Situações Desconfortáveis" 
                    className="w-full h-auto block transition-transform duration-300 group-hover:scale-[1.02]" 
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    width="464"
                    height="261"
                  />
                </div>
                <div className="p-5 md:p-6 space-y-2">
                  <h3 className="text-base min-[390px]:text-lg font-display font-bold text-white">
                    25 SITUAÇÕES DESCONFORTÁVEIS PARA PRATICAR
                  </h3>
                  <p className="text-xs min-[390px]:text-sm text-cream/75 leading-relaxed">
                    Exercícios para trabalho, família, amizades, dinheiro e relacionamentos.
                  </p>
                </div>
              </div>
              <div className="p-5 md:p-6 pt-0 border-t border-cream/10 text-[10px] font-bold text-cream/60 uppercase tracking-widest">
                INCLUSO NO PLANO COMPLETO
              </div>
            </div>

          </div>

          <div className="text-center mt-12 pt-8 border-t border-cream/10">
            <span className="text-xs min-[390px]:text-sm text-cream/80 tracking-wide font-sans">
              Não basta entender seus limites. Você precisa praticá-los até eles se tornarem naturais.
            </span>
          </div>

        </div>
      </section>

      {/* ──────────────────────────────────────────────────────── */}
      {/* 5. OFERTA E PLANOS DE PREÇO */}
      {/* ──────────────────────────────────────────────────────── */}
      <div id="oferta" className="scroll-mt-6"></div>
      <section id="planos" className="w-full py-16 md:py-24 max-w-7xl mx-auto px-4 scroll-mt-6">
        
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <span className="text-[11px] font-bold uppercase tracking-widest text-burnt">
            Preço Justo e Transparente
          </span>
          <h2 className="text-xl min-[390px]:text-2xl md:text-4xl font-display font-bold text-navy mt-2 leading-tight">
            Escolha como você quer começar.
          </h2>
          <p className="text-xs min-[390px]:text-sm md:text-base text-slate-text mt-3">
            Você pode começar pelo essencial ou levar a versão completa com todas as ferramentas de prática.
          </p>
        </div>

        {/* Layout dos Planos */}
        <div className="flex flex-col md:flex-row gap-8 max-w-4xl mx-auto items-stretch justify-center">
          
          {/* PLANO 1 — GUIA ESSENCIAL */}
          <div className="w-full md:w-1/2 bg-cream border border-soft-border rounded-2xl p-6 min-[390px]:p-8 shadow-sm flex flex-col justify-between transform hover:scale-[1.01] transition-transform">
            
            <div>
              <div className="mb-6 space-y-1">
                <span className="text-[10px] font-bold text-slate-text uppercase tracking-widest">Acesso Básico</span>
                <h3 className="text-lg md:text-xl font-display font-bold text-navy">GUIA ESSENCIAL</h3>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-navy">R$</span>
                  <span className="text-4xl min-[390px]:text-5xl font-display font-extrabold text-navy leading-none">9,90</span>
                </div>
                <p className="text-xs text-slate-text mt-2 font-medium">
                  Pagamento único • Acesso imediato
                </p>
              </div>

              {/* Lista de itens inclusos */}
              <ul className="space-y-3.5 mb-8 text-xs min-[390px]:text-sm text-navy/90 border-t border-soft-border/50 pt-5">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-burnt/70 shrink-0 mt-0.5" />
                  <span>E-book Método PAUSA</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-burnt/70 shrink-0 mt-0.5" />
                  <span>Frases prontas para dizer não</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-burnt/70 shrink-0 mt-0.5" />
                  <span>Como recusar sem se explicar demais</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-burnt/70 shrink-0 mt-0.5" />
                  <span>Mini plano de 7 dias</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-burnt/70 shrink-0 mt-0.5" />
                  <span>Checklist antes de dizer sim</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <button
                ref={triggerButtonRef}
                /* Para reativar o Upsell de R$ 16,90 no futuro, altere a linha abaixo de volta para: onClick={() => openUpsell(triggerButtonRef)} */
                onClick={handleBuyBasicDirectly}
                className="w-full bg-navy text-cream font-display font-bold text-[13px] min-[390px]:text-sm md:text-base tracking-wider uppercase py-4 px-6 rounded-lg hover:bg-navy/95 active:scale-[0.98] transition-all duration-150 min-h-[52px] shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                Quero o Guia Essencial
              </button>

              {/* Repetir badges de confiança */}
              <div className="flex items-center justify-center gap-3.5 text-[10px] min-[390px]:text-xs text-slate-text/90 font-medium pt-2 border-t border-soft-border/30">
                <span className="flex items-center gap-0.5">✓ Acesso imediato</span>
                <span className="flex items-center gap-0.5">✓ Pagamento único</span>
                <span className="flex items-center gap-0.5">✓ Garantia de 7 dias</span>
              </div>
            </div>

          </div>

          {/* PLANO 2 — PLANO COMPLETO (Com Destaque) */}
          <div className="w-full md:w-1/2 bg-[#FCF8F2] border-2 border-burnt rounded-2xl p-6 min-[390px]:p-8 shadow-md flex flex-col justify-between relative transform hover:scale-[1.01] transition-transform">
            
            <div className="absolute -top-4 right-6 bg-burnt text-white text-[9px] min-[390px]:text-[10px] font-bold px-3 py-1 rounded-full tracking-wider uppercase shadow-sm">
              Mais Completo
            </div>

            <div>
              <div className="mb-6 space-y-1">
                <span className="text-[10px] font-bold text-slate-text uppercase tracking-widest">Opção Recomendada</span>
                <h3 className="text-lg md:text-xl font-display font-bold text-navy">PLANO COMPLETO</h3>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-navy">R$</span>
                  <span className="text-4xl min-[390px]:text-5xl font-display font-extrabold text-navy leading-none">19,90</span>
                </div>
                <p className="text-xs text-slate-text mt-2 font-medium">
                  Pagamento único • Acesso imediato
                </p>
              </div>

              {/* Lista de itens inclusos */}
              <ul className="space-y-3.5 mb-8 text-xs min-[390px]:text-sm text-navy/90 border-t border-soft-border/50 pt-5">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-burnt shrink-0 mt-0.5" />
                  <span><strong>Tudo</strong> do Guia Essencial</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-burnt shrink-0 mt-0.5" />
                  <span>Mapa mental de dizer não</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-burnt shrink-0 mt-0.5" />
                  <span>Roteiro de reforço após dizer não</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-burnt shrink-0 mt-0.5" />
                  <span>Áudio diário de fortalecimento</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-burnt shrink-0 mt-0.5" />
                  <span>25 situações desconfortáveis para praticar</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleBuyPremiumDirectly}
                className="w-full bg-burnt text-white font-display font-bold text-[13px] min-[390px]:text-sm md:text-base tracking-wider uppercase py-4 px-6 rounded-lg hover:bg-burnt/95 active:scale-[0.98] transition-all duration-150 min-h-[52px] shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                Quero o Plano Completo
              </button>

              {/* Repetir badges de confiança */}
              <div className="flex items-center justify-center gap-3.5 text-[10px] min-[390px]:text-xs text-slate-text/90 font-medium pt-2 border-t border-soft-border/30">
                <span className="flex items-center gap-0.5">✓ Acesso imediato</span>
                <span className="flex items-center gap-0.5">✓ Pagamento único</span>
                <span className="flex items-center gap-0.5">✓ Garantia de 7 dias</span>
              </div>
            </div>

          </div>

        </div>

      </section>

      {/* ──────────────────────────────────────────────────────── */}
      {/* 6. GARANTIA — SEM IMAGENS, SELO NATIVO */}
      {/* ──────────────────────────────────────────────────────── */}
      <section className="w-full bg-cream py-16 md:py-20 border-y border-soft-border/50">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          
          {/* Selo visual nativo com CSS/SVG */}
          <div className="mx-auto flex items-center justify-center">
            <div className="relative w-20 h-20 rounded-full border-4 border-burnt/15 flex items-center justify-center bg-sand">
              <Shield className="w-10 h-10 text-burnt" />
              <div className="absolute -bottom-1 bg-burnt text-white text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                7 Dias
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-widest text-burnt">
              Selo de Tranquilidade
            </span>
            <h2 className="text-xl min-[390px]:text-2xl md:text-3xl font-display font-bold text-navy">
              Você tem 7 dias para decidir com tranquilidade.
            </h2>
          </div>

          <p className="text-xs min-[390px]:text-sm md:text-base text-slate-text leading-relaxed max-w-2xl mx-auto">
            Acesse o conteúdo, veja se ele faz sentido para a sua realidade e comece a aplicar. Caso perceba que o material não é para você, solicite o reembolso dentro de 7 dias.
          </p>

          <div className="pt-2">
            <span className="inline-flex items-center gap-1.5 text-xs min-[390px]:text-sm font-semibold text-navy uppercase tracking-widest bg-sand border border-soft-border px-4 py-2 rounded-full">
              GARANTIA DE 7 DIAS
            </span>
          </div>

        </div>
      </section>

      {/* ──────────────────────────────────────────────────────── */}
      {/* 7. FAQ — ACORDEÕES ACESSÍVEIS */}
      {/* ──────────────────────────────────────────────────────── */}
      <section className="w-full py-16 md:py-24 max-w-4xl mx-auto px-4">
        
        <div className="text-center mb-12 md:mb-16">
          <span className="text-[11px] font-bold uppercase tracking-widest text-burnt">
            Suporte e Dúvidas
          </span>
          <h2 className="text-xl min-[390px]:text-2xl md:text-4xl font-display font-bold text-navy mt-2">
            Dúvidas frequentes
          </h2>
        </div>

        <div className="space-y-4">
          
          {/* FAQ 1 */}
          <div className="border border-soft-border rounded-xl bg-cream overflow-hidden">
            <button
              onClick={() => toggleFaq(1)}
              className="w-full flex items-center justify-between p-5 text-left text-xs min-[390px]:text-sm md:text-base font-bold text-navy hover:bg-sand/30 transition-colors cursor-pointer"
            >
              <span>Isso é terapia?</span>
              {activeFaqIndex === 1 ? <ChevronUp className="w-4 h-4 text-burnt" /> : <ChevronDown className="w-4 h-4 text-navy/70" />}
            </button>
            {activeFaqIndex === 1 && (
              <div className="p-5 pt-0 text-xs min-[390px]:text-sm text-slate-text leading-relaxed border-t border-soft-border/45 bg-sand/10">
                Não. O Método PAUSA é um material educativo e prático sobre comunicação, limites e posicionamento pessoal.
              </div>
            )}
          </div>

          {/* FAQ 2 */}
          <div className="border border-soft-border rounded-xl bg-cream overflow-hidden">
            <button
              onClick={() => toggleFaq(2)}
              className="w-full flex items-center justify-between p-5 text-left text-xs min-[390px]:text-sm md:text-base font-bold text-navy hover:bg-sand/30 transition-colors cursor-pointer"
            >
              <span>Vou receber o material na hora?</span>
              {activeFaqIndex === 2 ? <ChevronUp className="w-4 h-4 text-burnt" /> : <ChevronDown className="w-4 h-4 text-navy/70" />}
            </button>
            {activeFaqIndex === 2 && (
              <div className="p-5 pt-0 text-xs min-[390px]:text-sm text-slate-text leading-relaxed border-t border-soft-border/45 bg-sand/10">
                Sim. Assim que o pagamento for aprovado, você recebe acesso imediato ao conteúdo digital.
              </div>
            )}
          </div>

          {/* FAQ 3 */}
          <div className="border border-soft-border rounded-xl bg-cream overflow-hidden">
            <button
              onClick={() => toggleFaq(3)}
              className="w-full flex items-center justify-between p-5 text-left text-xs min-[390px]:text-sm md:text-base font-bold text-navy hover:bg-sand/30 transition-colors cursor-pointer"
            >
              <span>É uma assinatura?</span>
              {activeFaqIndex === 3 ? <ChevronUp className="w-4 h-4 text-burnt" /> : <ChevronDown className="w-4 h-4 text-navy/70" />}
            </button>
            {activeFaqIndex === 3 && (
              <div className="p-5 pt-0 text-xs min-[390px]:text-sm text-slate-text leading-relaxed border-t border-soft-border/45 bg-sand/10">
                Não. O pagamento é único. Não existe cobrança mensal.
              </div>
            )}
          </div>

          {/* FAQ 4 */}
          <div className="border border-soft-border rounded-xl bg-cream overflow-hidden">
            <button
              onClick={() => toggleFaq(4)}
              className="w-full flex items-center justify-between p-5 text-left text-xs min-[390px]:text-sm md:text-base font-bold text-navy hover:bg-sand/30 transition-colors cursor-pointer"
            >
              <span>Serve para trabalho, família e relacionamentos?</span>
              {activeFaqIndex === 4 ? <ChevronUp className="w-4 h-4 text-burnt" /> : <ChevronDown className="w-4 h-4 text-navy/70" />}
            </button>
            {activeFaqIndex === 4 && (
              <div className="p-5 pt-0 text-xs min-[390px]:text-sm text-slate-text leading-relaxed border-t border-soft-border/45 bg-sand/10">
                Sim. O material aborda limites em situações cotidianas, incluindo pedidos, favores, convites, cobranças e conversas desconfortáveis.
              </div>
            )}
          </div>

          {/* FAQ 5 */}
          <div className="border border-soft-border rounded-xl bg-cream overflow-hidden">
            <button
              onClick={() => toggleFaq(5)}
              className="w-full flex items-center justify-between p-5 text-left text-xs min-[390px]:text-sm md:text-base font-bold text-navy hover:bg-sand/30 transition-colors cursor-pointer"
            >
              <span>Eu tenho muita dificuldade em dizer não. Serve para mim?</span>
              {activeFaqIndex === 5 ? <ChevronUp className="w-4 h-4 text-burnt" /> : <ChevronDown className="w-4 h-4 text-navy/70" />}
            </button>
            {activeFaqIndex === 5 && (
              <div className="p-5 pt-0 text-xs min-[390px]:text-sm text-slate-text leading-relaxed border-t border-soft-border/45 bg-sand/10">
                Sim. O material foi criado justamente para quem costuma dizer sim por culpa, medo de decepcionar ou dificuldade de se posicionar.
              </div>
            )}
          </div>

          {/* FAQ 6 */}
          <div className="border border-soft-border rounded-xl bg-cream overflow-hidden">
            <button
              onClick={() => toggleFaq(6)}
              className="w-full flex items-center justify-between p-5 text-left text-xs min-[390px]:text-sm md:text-base font-bold text-navy hover:bg-sand/30 transition-colors cursor-pointer"
            >
              <span>Qual a diferença entre o Guia Essencial e o Plano Completo?</span>
              {activeFaqIndex === 6 ? <ChevronUp className="w-4 h-4 text-burnt" /> : <ChevronDown className="w-4 h-4 text-navy/70" />}
            </button>
            {activeFaqIndex === 6 && (
              <div className="p-5 pt-0 text-xs min-[390px]:text-sm text-slate-text leading-relaxed border-t border-soft-border/45 bg-sand/10">
                O Guia Essencial entrega a base do Método PAUSA. O Plano Completo inclui ferramentas extras para prática, repetição e fortalecimento diário.
              </div>
            )}
          </div>

        </div>

      </section>

      {/* ──────────────────────────────────────────────────────── */}
      {/* 8. RODAPÉ */}
      {/* ──────────────────────────────────────────────────────── */}
      <footer className="w-full bg-navy text-cream py-12 border-t border-cream/10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="text-center md:text-left space-y-1.5">
            <span className="font-display font-bold text-base text-white tracking-widest block uppercase">
              MÉTODO PAUSA
            </span>
            <p className="text-[11px] text-cream/60">
              Método PAUSA © 2026. Todos os direitos reservados.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-cream/75">
            <button
              onClick={() => setActiveFooterModal("privacidade")}
              className="hover:text-white hover:underline transition-all cursor-pointer"
            >
              Política de Privacidade
            </button>
            <button
              onClick={() => setActiveFooterModal("termos")}
              className="hover:text-white hover:underline transition-all cursor-pointer"
            >
              Termos de Uso
            </button>
            <button
              onClick={() => setActiveFooterModal("contato")}
              className="hover:text-white hover:underline transition-all cursor-pointer"
            >
              Contato
            </button>
          </div>

        </div>
      </footer>

      {/* ──────────────────────────────────────────────────────── */}
      {/* POPUP DE UPSELL DO GUIA ESSENCIAL — REGRA CRÍTICA MOBILE */}
      {/* ──────────────────────────────────────────────────────── */}
      {isUpsellOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4"
          role="dialog"
          aria-modal="true"
          onClick={closeUpsell}
        >
          {/* Content panel */}
          <div 
            ref={modalRef}
            tabIndex={-1}
            className="bg-cream w-full md:max-w-[520px] rounded-t-2xl md:rounded-2xl flex flex-col justify-between overflow-hidden shadow-2xl max-h-[90dvh] md:max-h-[85vh] transition-transform duration-300 transform translate-y-0"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Header / Barra de título fixa no topo do modal */}
            <div className="px-5 py-4 border-b border-soft-border flex items-center justify-between shrink-0 bg-cream">
              <span className="text-[10px] min-[390px]:text-xs font-bold text-burnt uppercase tracking-widest bg-burnt/10 px-2.5 py-1 rounded">
                Oferta de Upgrade
              </span>
              <button 
                onClick={closeUpsell}
                className="w-8 h-8 rounded-full hover:bg-sand flex items-center justify-center text-navy/70 hover:text-navy transition-colors cursor-pointer"
                aria-label="Fechar popup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo rolável interno (se necessário) */}
            <div className="overflow-y-auto p-5 md:p-6 space-y-5 flex-grow">
              
              <div className="space-y-2">
                <h3 className="text-base min-[390px]:text-lg md:text-xl font-display font-bold text-navy leading-tight">
                  Por apenas mais R$7,00, leve o Plano Completo por R$16,90.
                </h3>
                <p className="text-xs min-[390px]:text-sm text-slate-text leading-relaxed">
                  Você já escolheu o Guia Essencial. Com esta oportunidade única de upgrade, adicione todas as ferramentas do Plano Completo por apenas R$16,90 (economize R$3,00)!
                </p>
              </div>

              {/* Lista curta de bônus inclusos no upgrade */}
              <ul className="space-y-2.5 bg-sand/35 p-4 rounded-xl border border-soft-border/50 text-xs min-[390px]:text-sm text-navy/90">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-burnt shrink-0 mt-0.5" />
                  <span>Mapa mental de dizer não</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-burnt shrink-0 mt-0.5" />
                  <span>Roteiro de reforço após dizer não</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-burnt shrink-0 mt-0.5" />
                  <span>Áudio diário de fortalecimento</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-burnt shrink-0 mt-0.5" />
                  <span>25 situações desconfortáveis para praticar</span>
                </li>
              </ul>

              {/* Comparação visual de preços */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-sand/20 border border-soft-border/50 rounded-lg p-3 text-center">
                  <span className="text-[10px] font-bold text-slate-text uppercase tracking-wider block">Guia Essencial</span>
                  <span className="text-base min-[390px]:text-lg font-bold text-slate-text/90">R$ 9,90</span>
                </div>
                <div className="bg-burnt/5 border border-burnt/35 rounded-lg p-3 text-center">
                  <span className="text-[10px] font-bold text-burnt uppercase tracking-wider block">Plano Completo</span>
                  <span className="text-base min-[390px]:text-lg font-bold text-burnt">R$ 16,90</span>
                </div>
              </div>

            </div>

            {/* AÇÕES FIXAS NO RODAPÉ DO POPUP — REGRA CRÍTICA PARA APARECER SEM ROLAGEM */}
            <div className="p-5 md:p-6 border-t border-soft-border bg-cream shrink-0 space-y-3">
              
              <button
                ref={acceptButtonRef}
                onClick={handleAcceptUpgrade}
                className="w-full bg-burnt text-white font-display font-bold text-[13px] min-[390px]:text-sm tracking-wider uppercase py-4 rounded-lg hover:bg-burnt/95 active:scale-[0.98] transition-all duration-150 min-h-[52px] shadow-sm flex items-center justify-center gap-1 cursor-pointer"
              >
                Sim, quero o Plano Completo por R$16,90
              </button>

              <button
                onClick={handleDeclineUpgrade}
                className="w-full bg-cream border border-navy/70 text-navy font-display font-bold text-[12px] min-[390px]:text-[13px] tracking-wider uppercase py-3.5 rounded-lg hover:bg-sand/30 active:scale-[0.98] transition-all duration-150 min-h-[48px] flex items-center justify-center cursor-pointer"
              >
                Continuar apenas com o Guia Essencial por R$9,90
              </button>

              {/* Margem de segurança inferior para mobile screens */}
              <div style={{ height: "max(4px, env(safe-area-inset-bottom))" }} />
            </div>

          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* MODAIS DO RODAPÉ (PRIVACIDADE, TERMOS, CONTATO) */}
      {/* ──────────────────────────────────────────────────────── */}
      {activeFooterModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setActiveFooterModal(null)}
        >
          <div 
            ref={footerModalRef}
            className="bg-cream w-full max-w-lg rounded-2xl p-6 border border-soft-border shadow-2xl flex flex-col justify-between max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            
            <div className="flex items-center justify-between border-b border-soft-border pb-4 mb-4">
              <h3 className="text-base min-[390px]:text-lg font-display font-bold text-navy uppercase tracking-wider">
                {activeFooterModal === "privacidade" && "Política de Privacidade"}
                {activeFooterModal === "termos" && "Termos de Uso"}
                {activeFooterModal === "contato" && "Fale Conosco"}
              </h3>
              <button 
                onClick={() => setActiveFooterModal(null)}
                className="w-8 h-8 rounded-full hover:bg-sand flex items-center justify-center text-navy/70 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs min-[390px]:text-sm text-slate-text leading-relaxed">
              {activeFooterModal === "privacidade" && (
                <>
                  <p>Sua privacidade é importante para nós. É política do Método PAUSA respeitar a sua privacidade em relação a qualquer informação sua que possamos coletar no nosso site.</p>
                  <p>Solicitamos informações pessoais apenas quando realmente precisamos delas para lhe fornecer um serviço ou processar suas compras com segurança. Fazemo-lo por meios justos e legais, com o seu conhecimento e consentimento.</p>
                  <p>Não compartilhamos informações de identificação pessoal publicamente ou com terceiros, exceto quando exigido por lei ou para integrar os sistemas oficiais de entrega do infoproduto.</p>
                </>
              )}

              {activeFooterModal === "termos" && (
                <>
                  <p>Ao adquirir o Método PAUSA, você concorda em cumprir estes termos de serviço, todas as leis e regulamentos aplicáveis ​​e concorda que é responsável pelo cumprimento de todas as leis locais aplicáveis.</p>
                  <p>Os materiais contidos neste site e no produto entregue são protegidos pelas leis de direitos autorais e marcas comerciais aplicáveis.</p>
                  <p>A licença concedida é estritamente pessoal, individual e intransferível. Qualquer forma de revenda ou distribuição é proibida.</p>
                </>
              )}

              {activeFooterModal === "contato" && (
                <div className="space-y-4">
                  <p>Tem alguma dúvida ou precisa de suporte com a sua compra? Estamos prontos para ajudar você no e-mail abaixo:</p>
                  <div className="bg-sand/40 border border-soft-border p-4 rounded-xl text-center font-semibold text-navy text-sm">
                    suporte@metodopausa.com.br
                  </div>
                  <p className="text-xs text-slate-text italic">
                    Nosso suporte responde em até 24 horas úteis, de segunda a sexta-feira.
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-soft-border mt-6 pt-4 text-right">
              <button 
                onClick={() => setActiveFooterModal(null)}
                className="bg-navy text-cream px-5 py-2 rounded-lg text-xs font-semibold hover:bg-navy/90 cursor-pointer"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* BARRA FIXA FLUTUANTE DE COMPRA */}
      {showFloatingBar && (
        <div 
          className="fixed bottom-4 left-0 right-0 z-40 px-3 md:px-4 flex justify-center pointer-events-none"
          id="floating-purchase-bar"
        >
          <div className="w-full max-w-4xl bg-navy text-cream rounded-xl border border-cream/10 shadow-xl p-3 md:p-4 flex flex-col md:flex-row items-center justify-between gap-3 pointer-events-auto">
            {/* Esquerda / Topo */}
            <div className="flex items-center gap-2.5 text-center md:text-left">
              <div className="hidden md:flex w-8 h-8 rounded-full bg-burnt/10 border border-burnt/15 items-center justify-center text-burnt">
                <Check className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] md:text-xs font-bold tracking-widest uppercase text-burnt">
                  Método PAUSA • Acesso imediato
                </div>
                <div className="hidden md:block text-[11px] text-cream/70">
                  Guia Prático Essencial + Bônus Disponíveis
                </div>
              </div>
            </div>

            {/* Direita / Botão */}
            <div className="w-full md:w-auto flex items-center gap-3">
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-[10px] text-cream/60 line-through">De R$ 47,00</span>
                <span className="text-sm font-bold text-white">Por apenas R$ 9,90</span>
              </div>
              <button
                onClick={() => {
                  const ofertaSection = document.getElementById("planos");
                  if (ofertaSection) {
                    ofertaSection.scrollIntoView({ behavior: "smooth" });
                  }
                  trackCustomPixel("FloatingCtaClicked", { price: 9.90 });
                }}
                className="w-full md:w-auto bg-burnt text-white font-display font-bold text-xs tracking-wider uppercase py-3 px-6 rounded-lg hover:bg-burnt/95 active:scale-95 transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
              >
                QUERO COMEÇAR POR R$9,90
                <ChevronRight className="w-4 h-4 text-white shrink-0" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE AMPLIAR IMAGEM (WHATSAPP CHATS) */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 bg-navy/85 backdrop-blur-xs z-50 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-sm w-full max-h-[90vh] flex flex-col items-center">
            <button 
              onClick={() => setZoomedImage(null)}
              className="absolute -top-12 right-0 text-cream hover:text-white font-bold bg-navy/50 w-10 h-10 rounded-full flex items-center justify-center text-lg border border-cream/10 active:scale-95 transition-transform"
            >
              ✕
            </button>
            <img 
              src={zoomedImage} 
              alt="Conversa ampliada" 
              className="max-h-[80vh] w-auto rounded-xl object-contain border border-cream/20 shadow-2xl cursor-default"
              onClick={(e) => e.stopPropagation()}
            />
            <p className="text-cream/80 text-xs mt-3 text-center tracking-wide">
              Clique em qualquer lugar fora para fechar
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
