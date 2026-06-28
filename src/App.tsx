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
  basicPrice: "R$19,90",
  premiumPrice: "R$29,90",
  premiumUpsellPrice: "R$29,90",
  basicCheckoutUrl: "https://pay.lowify.com.br/checkout.php?product_id=wRm0cE", // Plano 19,90 (Guia Essencial)
  premiumCheckoutUrl: "https://pay.lowify.com.br/checkout.php?product_id=WePDaM", // Plano 29,90 (Plano Completo)
  premiumUpsellCheckoutUrl: "https://pay.lowify.com.br/checkout.php?product_id=WePDaM", // Plano 29,90 (Upsell)
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

// ============================================================================
// DADOS DO SIMULADOR INTERATIVO DO WHATSAPP (MÉTODO PAUSA)
// ============================================================================
const SIMULATOR_DATA = {
  amiga: {
    tabLabel: "💬 Amiga (Empréstimo)",
    name: "Ana Amiga",
    avatarColor: "bg-amber-500",
    inboundMsg: "Amiga, você pode me emprestar R$500? Eu pago sem falta no começo do mês que vem, juro! Quebra esse galho pra mim, estou desesperada... 🥺",
    inboundTime: "14:32",
    culpado: {
      msg: "Ai amiga, eu tô meio apertada esse mês mas tudo bem... posso sim! Deixa eu ver como faço aqui na minha conta e te mando até o fim do dia...",
      consequence: "Você se aperta financeiramente, fica ressentida por não conseguir dizer não e passa semanas ansiosa com medo de não receber de volta."
    },
    pausa: {
      msg: "Oi Ana! No momento eu não tenho como te emprestar esse valor. Espero que consiga resolver logo de outra forma! Torcendo por você.",
      consequence: "Você protege seu dinheiro e sua paz. Resposta limpa, honesta e sem desculpas em excesso. A amizade continua intacta e sem ressentimento."
    }
  },
  trabalho: {
    tabLabel: "💼 Chefe (Fora de Hora)",
    name: "Chefe Roberto",
    avatarColor: "bg-slate-600",
    inboundMsg: "Olá, consegue me enviar aquele relatório consolidado ainda hoje? Sei que é domingo, mas o cliente me mandou mensagem pedindo com urgência para amanhã às 8h.",
    inboundTime: "15:45",
    culpado: {
      msg: "Oi chefe... Claro, sem problemas! Vou ligar o computador aqui correndo e já faço isso. Me dá umas 2 horinhas e já te envio por e-mail.",
      consequence: "Seu único dia de descanso com a família é arruinado. Você trabalha de graça, sob estresse, e ensina seu chefe que você está disponível 24h por dia."
    },
    pausa: {
      msg: "Oi Roberto! Hoje estou sem acesso ao computador, mas amanhã logo no início do expediente o relatório será minha prioridade número um. Boa noite!",
      consequence: "Seu domingo de lazer e saúde mental são preservados. Você estabelece um limite profissional saudável sem parecer grossa ou descompromissada."
    }
  },
  familia: {
    tabLabel: "🏠 Família (Favor Difícil)",
    name: "Tia Regina",
    avatarColor: "bg-teal-600",
    inboundMsg: "Minha querida, você pode me levar ao médico amanhã às 14h? Sei que você trabalha, mas como você trabalha de casa é mais flexível pra você, né? Beijos!",
    inboundTime: "10:15",
    culpado: {
      msg: "Oi tia! Posso sim... Vou ver se desmarco duas reuniões importantes de trabalho aqui e dou um jeito de te levar. Que horas passo aí?",
      consequence: "Você prejudica suas entregas profissionais, acumula tarefas acumuladas para a noite e sente uma culpa enorme por não conseguir equilibrar tudo."
    },
    pausa: {
      msg: "Oi tia Regina! Amanhã à tarde é um horário em que estarei no meio de compromissos de trabalho inadiáveis. Infelizmente dessa vez não consigo te levar. Espero que encontre outra opção!",
      consequence: "Seu trabalho home-office é respeitado como trabalho de verdade. Você diz não com clareza e elegância, sem precisar mentir ou se desdobrar em mil."
    }
  },
  cliente: {
    tabLabel: "💰 Cliente (Sexta à Noite)",
    name: "Marcos Cliente",
    avatarColor: "bg-indigo-600",
    inboundMsg: "Oi, tudo bem? Olha só, conseguimos fechar aquele projeto hoje, mas meu orçamento estourou. Consegue me dar 40% de desconto para fecharmos agora mesmo?",
    inboundTime: "18:10",
    culpado: {
      msg: "Oi Marcos, entendo seu lado... Puxa, tudo bem então, eu faço esse desconto sim só para a gente não perder a oportunidade de trabalhar juntos. Fechado!",
      consequence: "Você desvaloriza totalmente suas horas de dedicação, trabalha sem margem de lucro e atrai um cliente que vai te cobrar o triplo por metade do preço."
    },
    pausa: {
      msg: "Oi Marcos! Fico feliz que queira fechar. O valor que enviei é o mínimo para garantir a entrega ideal para o seu projeto. Caso queira, podemos reduzir alguns itens do escopo para ajustar ao seu orçamento. O que acha?",
      consequence: "Você protege sua dignidade financeira e seu posicionamento profissional. O cliente entende que seu serviço é sério e respeita suas regras de negócio."
    }
  }
};

export default function App() {
  const [sessionPage, setSessionPage] = useState<"landing" | "basic" | "premium" | "cancelled">("landing");
  const [isUpsellOpen, setIsUpsellOpen] = useState(false);
  const [activeFaqIndex, setActiveFaqIndex] = useState<number | null>(null);
  const [isPausaExpanded, setIsPausaExpanded] = useState(true);

  // Estados do Simulador do WhatsApp (Dopamina e Prática)
  const [activeSimTab, setActiveSimTab] = useState<"amiga" | "trabalho" | "familia" | "cliente">("amiga");
  const [simAnswerMode, setSimAnswerMode] = useState<"none" | "culpado" | "pausa">("none");
  const [isSimTyping, setIsSimTyping] = useState(false);

  const handleSimTabChange = (tab: "amiga" | "trabalho" | "familia" | "cliente") => {
    setActiveSimTab(tab);
    setSimAnswerMode("none");
    setIsSimTyping(false);
    trackCustomPixel("SimulatorTabChanged", { tab });
  };

  const handleTriggerSimAnswer = (mode: "culpado" | "pausa") => {
    setIsSimTyping(true);
    setSimAnswerMode("none");
    trackCustomPixel("SimulatorAnswerTriggered", { mode, tab: activeSimTab });
    setTimeout(() => {
      setIsSimTyping(false);
      setSimAnswerMode(mode);
    }, 900); // tempo de digitação satisfatório (dopaminérgico)
  };

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

  const scrollToMetodoPausa = () => {
    const targetSection = document.getElementById("metodo-pausa");
    if (targetSection) {
      targetSection.scrollIntoView({ behavior: "smooth" });
      trackCustomPixel("CtaToMetodoPausaClicked", { target: "metodo-pausa" });
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
      value: 19.90,
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
      value: 29.90,
      currency: "BRL"
    });
    trackCustomPixel("AcceptUpgrade", { price: 29.90 });
    window.location.href = addUtmsToUrl(config.premiumUpsellCheckoutUrl);
  };

  const handleDeclineUpgrade = () => {
    trackPixel("Purchase", {
      content_name: "Guia Essencial",
      value: 19.90,
      currency: "BRL"
    });
    trackCustomPixel("DeclineUpgrade", { price: 19.90 });
    window.location.href = addUtmsToUrl(config.basicCheckoutUrl);
  };

  const handleBuyBasicDirectly = () => {
    trackPixel("InitiateCheckout", {
      content_name: "Guia Essencial (Direto)",
      value: 19.90,
      currency: "BRL"
    });
    trackCustomPixel("BuyBasicDirect", { price: 19.90 });
    window.location.href = addUtmsToUrl(config.basicCheckoutUrl);
  };

  const handleBuyPremiumDirectly = () => {
    trackPixel("InitiateCheckout", {
      content_name: "Plano Completo (Direto)",
      value: 29.90,
      currency: "BRL"
    });
    trackCustomPixel("BuyPremiumDirect", { price: 29.90 });
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
      {/* ─────────────────────────────────────────────────      {/* ──────────────────────────────────────────────────────── */}
      {/* 1. HERO — PRIMEIRA DOBRA */}
      {/* ──────────────────────────────────────────────────────── */}
      <header className="relative w-full max-w-7xl mx-auto px-4 py-6 min-[390px]:py-8 md:py-16 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
        
        {/* Lado esquerdo (Desktop) ou Topo (Mobile) */}
        <div className="md:col-span-7 flex flex-col items-start text-left space-y-4">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-burnt/10 border border-burnt/15 text-burnt text-[11px] min-[390px]:text-xs font-bold tracking-widest uppercase">
            MÉTODO PAUSA • GUIA DIGITAL
          </div>
          
          <h1 className="text-xl min-[360px]:text-[1.35rem] min-[390px]:text-[1.65rem] min-[430px]:text-[1.85rem] md:text-4xl lg:text-5xl font-display font-bold text-navy leading-tight tracking-tight uppercase">
            APRENDA A DIZER <span className="text-burnt">“NÃO”</span> SEM <span className="text-burnt">CULPA</span> — E SEM <span className="text-burnt">SE ABANDONAR</span>.
          </h1>

          <p className="text-sm min-[390px]:text-base md:text-lg text-navy font-bold leading-tight font-sans mt-3 md:mt-4">
            Pronto para aplicar ainda hoje.
          </p>
          
          <p className="text-[11px] min-[390px]:text-xs md:text-[13px] lg:text-sm text-slate-text/90 leading-relaxed font-sans font-normal max-w-xl mt-1 md:mt-2">
            Frases prontas, exercícios práticos e um método simples para você se posicionar sem brigar, sem se explicar demais e sem voltar atrás por culpa.
          </p>

          {/* Versão Mobile: Imagem da Hero de produto premium inserida abaixo do texto no mobile com aumento de ~10% */}
          <div className="block md:hidden w-full mt-5 mb-2 px-1">
            <div className="overflow-hidden rounded-xl border border-soft-border/60 bg-cream shadow-sm max-w-md mx-auto transform scale-[1.08] transition-transform duration-300">
              <img 
                src="https://i.ibb.co/yBXf95ND/Banner-Hero.webp" 
                alt="Mockup do Método PAUSA" 
                className="w-full h-auto object-cover"
                id="hero-image-mobile"
                loading="eager"
                fetchPriority="high"
                width="450"
                height="337"
              />
            </div>
          </div>

          <div className="w-full flex flex-col space-y-3 pt-2 md:pt-4 max-w-md">
            <button
              onClick={scrollToOQueVoceRecebe}
              id="cta-hero-primary"
              className="w-full bg-burnt text-white font-display font-bold text-[13px] min-[390px]:text-sm md:text-base tracking-wider uppercase py-4 px-6 rounded-lg hover:bg-burnt/95 active:scale-[0.98] transition-all duration-150 min-h-[52px] shadow-sm flex items-center justify-center gap-2 cursor-pointer animate-pulse-subtle"
            >
              QUERO VER O QUE VOU RECEBER
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
          </div>
        </div>

        {/* Lado direito (Desktop) — Mockup Premium com aumento de ~10% */}
        <div className="hidden md:block md:col-span-5 pl-4">
          <div className="overflow-hidden rounded-xl border border-soft-border/60 bg-cream shadow-md transform scale-[1.1] transition-transform hover:scale-[1.12] duration-300">
            <img 
              src="https://i.ibb.co/yBXf95ND/Banner-Hero.webp" 
              alt="Método PAUSA Mockup Premium" 
              className="w-full h-auto object-cover"
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
      {/* 1.5. NOVO: SIMULADOR INTERATIVO DO WHATSAPP (AHA! MOMENT & DOPAMINA) */}
      {/* ──────────────────────────────────────────────────────── */}
      <section className="w-full bg-[#FCF8F2] py-14 md:py-20 border-y border-soft-border/60 scroll-mt-6">
        <div className="max-w-4xl mx-auto px-4">
          
          <div className="text-center max-w-2xl mx-auto mb-8 md:mb-12">
            <span className="inline-flex items-center gap-1.5 text-[10px] min-[390px]:text-[11px] font-bold uppercase tracking-widest text-burnt bg-burnt/10 px-3 py-1 rounded-full animate-pulse">
              ⚡ Simulador Interativo Método PAUSA
            </span>
            <h2 className="text-xl min-[390px]:text-2xl md:text-3.5xl font-display font-extrabold text-navy mt-4 leading-tight">
              COMO VOCÊ RESPONDERIA A ISTO?
            </h2>
            <p className="text-xs min-[390px]:text-sm text-slate-text mt-3">
              Toque em uma das situações reais do dia a dia abaixo e teste o poder de uma resposta livre de culpa e com limites elegantes.
            </p>
          </div>

          {/* Abas Horizontais (Deslizável no Mobile) */}
          <div className="flex overflow-x-auto pb-3 gap-2 no-scrollbar scroll-smooth snap-x -mx-4 px-4 md:mx-0 md:px-0 justify-start md:justify-center">
            {(Object.keys(SIMULATOR_DATA) as Array<keyof typeof SIMULATOR_DATA>).map((key) => {
              const isActive = activeSimTab === key;
              return (
                <button
                  key={key}
                  onClick={() => handleSimTabChange(key)}
                  className={`snap-center shrink-0 px-4 py-2.5 rounded-full text-xs font-bold tracking-wide transition-all duration-200 cursor-pointer border ${
                    isActive
                      ? "bg-burnt text-white border-burnt shadow-sm scale-[1.03]"
                      : "bg-cream text-navy/80 border-soft-border/70 hover:bg-sand/35"
                  }`}
                >
                  {SIMULATOR_DATA[key].tabLabel}
                </button>
              );
            })}
          </div>

          {/* Celular Mockup */}
          <div className="max-w-lg mx-auto bg-[#EFEAE2] rounded-3xl border-4 border-navy shadow-xl overflow-hidden mt-6 flex flex-col h-[520px] relative">
            
            {/* Header do Chat */}
            <div className="bg-[#075E54] text-white px-4 py-3 flex items-center justify-between shadow-sm shrink-0">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full ${SIMULATOR_DATA[activeSimTab].avatarColor} text-white flex items-center justify-center font-bold text-sm shadow-inner`}>
                  {SIMULATOR_DATA[activeSimTab].name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-bold tracking-wide leading-none">{SIMULATOR_DATA[activeSimTab].name}</h4>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <span className="text-[10px] text-emerald-100 font-medium tracking-wide">online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-white/95 text-xs">
                <span className="font-mono bg-emerald-700/60 px-2 py-0.5 rounded tracking-widest">WhatsApp</span>
              </div>
            </div>

            {/* Corpo de Mensagens (Fundo Clássico com Scroll) */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 flex flex-col justify-start" style={{ backgroundImage: "radial-gradient(rgba(0,0,0,0.04) 1px, transparent 1px)", backgroundSize: "16px 16px" }}>
              
              {/* Mensagem Recebida (Inbound) */}
              <div className="bg-white rounded-2xl rounded-tl-none p-3.5 max-w-[85%] self-start shadow-sm border border-black/5 relative animate-fade-in">
                <p className="text-xs min-[390px]:text-sm text-slate-800 leading-relaxed font-sans">
                  {SIMULATOR_DATA[activeSimTab].inboundMsg}
                </p>
                <span className="text-[9px] text-slate-400 block text-right mt-1.5 font-mono">
                  {SIMULATOR_DATA[activeSimTab].inboundTime}
                </span>
              </div>

              {/* Estado digitando... */}
              {isSimTyping && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl rounded-tr-none p-3 max-w-[85%] self-end shadow-xs flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-medium">Aplicando Método PAUSA...</span>
                </div>
              )}

              {/* Resposta Gerada */}
              {simAnswerMode !== "none" && !isSimTyping && (
                <div className={`rounded-2xl rounded-tr-none p-3.5 max-w-[85%] self-end shadow-sm border animate-fade-in relative ${
                  simAnswerMode === "culpado"
                    ? "bg-red-50 border-red-200 text-red-900"
                    : "bg-[#DCF8C6] border-[#c1e8a9] text-slate-800"
                }`}>
                  <p className="text-xs min-[390px]:text-sm leading-relaxed font-sans">
                    {simAnswerMode === "culpado"
                      ? SIMULATOR_DATA[activeSimTab].culpado.msg
                      : SIMULATOR_DATA[activeSimTab].pausa.msg}
                  </p>
                  <span className="text-[9px] text-slate-400 block text-right mt-1.5 font-mono">
                    15:46 ✓✓
                  </span>
                </div>
              )}

            </div>

            {/* Painel de Controle de Ações Interativas (Embaixo do celular) */}
            <div className="bg-white border-t border-soft-border/70 p-3.5 shrink-0 flex flex-col gap-2">
              <span className="text-[10px] font-bold text-slate-text uppercase tracking-wider text-center block">
                Escolha a sua resposta para simular:
              </span>
              <div className="grid grid-cols-2 gap-2">
                
                <button
                  onClick={() => handleTriggerSimAnswer("culpado")}
                  className={`py-3 px-3 rounded-xl border text-[11px] min-[390px]:text-xs font-bold uppercase tracking-wide cursor-pointer transition-all ${
                    simAnswerMode === "culpado"
                      ? "bg-red-600 text-white border-red-600 shadow-sm scale-[1.01]"
                      : "bg-cream text-red-700 border-red-200 hover:bg-red-50"
                  }`}
                >
                  ❌ Sim por Culpa
                </button>

                <button
                  onClick={() => handleTriggerSimAnswer("pausa")}
                  className={`py-3 px-3 rounded-xl border text-[11px] min-[390px]:text-xs font-bold uppercase tracking-wide cursor-pointer transition-all flex items-center justify-center gap-1 ${
                    simAnswerMode === "pausa"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm scale-[1.01]"
                      : "bg-[#E2F5D9] text-emerald-800 border-emerald-300 hover:bg-[#d4eec6] shadow-sm animate-pulse"
                  }`}
                >
                  ✨ Método PAUSA
                </button>

              </div>
            </div>

          </div>

          {/* Consequência Emocional Explicada (Fora do Celular para Máximo Impacto) */}
          <div className="max-w-lg mx-auto mt-4 min-h-[90px] transition-all duration-300">
            {simAnswerMode === "culpado" && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-left shadow-xs animate-fade-in">
                <h5 className="text-xs font-bold text-red-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  ⚠️ O Preço Oculto do Sim por Culpa:
                </h5>
                <p className="text-xs text-red-900 leading-relaxed">
                  {SIMULATOR_DATA[activeSimTab].culpado.consequence}
                </p>
              </div>
            )}

            {simAnswerMode === "pausa" && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-left shadow-xs animate-fade-in">
                <h5 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  ✅ A Liberdade do Método PAUSA:
                </h5>
                <p className="text-xs text-emerald-900 leading-relaxed">
                  {SIMULATOR_DATA[activeSimTab].pausa.consequence}
                </p>
              </div>
            )}

            {simAnswerMode === "none" && !isSimTyping && (
              <div className="bg-cream/40 border border-soft-border/30 rounded-xl p-4 text-center">
                <p className="text-xs italic text-slate-text/90">
                  Selecione acima como gostaria de responder e veja o efeito de cada decisão.
                </p>
              </div>
            )}

            {isSimTyping && (
              <div className="bg-cream/40 border border-soft-border/30 rounded-xl p-4 text-center animate-pulse">
                <p className="text-xs text-burnt font-semibold tracking-wide uppercase">
                  Estruturando resposta firme e sem culpa...
                </p>
              </div>
            )}
          </div>

          <div className="text-center mt-8">
            <button
              onClick={scrollToPlanos}
              className="w-full max-w-md bg-burnt text-white font-display font-bold text-[13px] min-[390px]:text-sm md:text-base tracking-wider uppercase py-4 px-6 rounded-lg hover:bg-burnt/95 active:scale-[0.98] transition-all duration-150 shadow-md flex items-center justify-center gap-2 cursor-pointer mx-auto shadow-burnt/10"
            >
              Quero ter acesso a todas as frases prontas
            </button>
          </div>

        </div>
      </section>

      {/* ──────────────────────────────────────────────────────── */}
      <section id="identificacao-dor" className="w-full bg-cream py-16 md:py-24 border-y border-soft-border/50 scroll-mt-6">
        <div className="max-w-3xl mx-auto px-4">
          
          <div className="text-center mb-10 md:mb-14">
            <span className="text-[11px] font-bold uppercase tracking-widest text-burnt bg-burnt/10 px-3.5 py-1.5 rounded-full">
              TALVEZ VOCÊ SE IDENTIFIQUE
            </span>
            <h2 className="text-xl min-[390px]:text-2xl md:text-4xl font-display font-bold text-navy mt-4 leading-tight">
              ESTE MATERIAL É PARA VOCÊ QUE:
            </h2>
          </div>

          {/* Checklist Editorial Premium */}
          <div className="bg-sand/35 rounded-2xl border border-soft-border/80 p-6 md:p-10 space-y-5 md:space-y-6 shadow-sm">
            {[
              "Sente culpa ao dizer não.",
              "Aceita pedidos mesmo quando já está sobrecarregada.",
              "Fica pensando por horas no que deveria ter respondido.",
              "Tem medo de parecer grossa, egoísta ou ingrata.",
              "Se explica demais para justificar uma decisão.",
              "Se coloca por último para evitar decepcionar alguém.",
              "Quer se posicionar sem brigar e sem perder a paz."
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-3.5 md:gap-4 group">
                <div className="w-6 h-6 rounded-full bg-burnt/10 text-burnt border border-burnt/15 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-burnt group-hover:text-white transition-all duration-300">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                </div>
                <p className="text-sm md:text-base text-navy font-medium leading-relaxed">
                  {item}
                </p>
              </div>
            ))}
          </div>

          {/* Frase de Efeito Editorial */}
          <div className="text-center mt-10 md:mt-12 space-y-6">
            <p className="text-base md:text-xl font-serif italic text-burnt font-semibold">
              “Você não precisa aprender a ser dura. Precisa aprender a ser clara.”
            </p>

            <div className="flex flex-col items-center">
              <button
                onClick={scrollToMetodoPausa}
                className="w-full max-w-md bg-burnt text-white font-display font-bold text-[13px] min-[390px]:text-sm md:text-base tracking-wider uppercase py-4 px-8 rounded-lg hover:bg-burnt/95 active:scale-[0.98] transition-all duration-150 shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                QUERO APRENDER A ME POSICIONAR
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ──────────────────────────────────────────────────────── */}
      {/* 2.5. COMPARATIVO IMPACTANTE — ANTES VS DEPOIS (EMOÇÃO E CONTRASTE) */}
      {/* ──────────────────────────────────────────────────────── */}
      <section className="w-full bg-cream py-14 md:py-20 border-b border-soft-border/50">
        <div className="max-w-5xl mx-auto px-4">
          
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
            <span className="text-[10px] min-[390px]:text-[11px] font-bold uppercase tracking-widest text-burnt bg-burnt/10 px-3 py-1 rounded-full">
              CONSEQUÊNCIAS REAIS
            </span>
            <h2 className="text-xl min-[390px]:text-2xl md:text-3.5xl font-display font-extrabold text-navy mt-4 leading-tight">
              O CICLO DO SIM POR CULPA <br className="hidden md:inline" />
              VS. A LIBERDADE DO MÉTODO PAUSA
            </h2>
            <p className="text-xs min-[390px]:text-sm text-slate-text mt-3">
              Dizer sim para todo mundo é dizer não para você mesma todos os dias. Compare como é viver sem limites vs. com o Método PAUSA:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-4xl mx-auto">
            
            {/* O VELHO CAMINHO (PAIN & FRUSTRATION) */}
            <div className="bg-red-50/45 border border-red-200/80 rounded-2xl p-6 min-[390px]:p-8 shadow-xs flex flex-col justify-between transform hover:scale-[1.01] transition-transform duration-200">
              <div>
                <span className="inline-block px-3 py-1 rounded-md bg-red-100 text-red-800 text-[10px] font-bold uppercase tracking-wider mb-5">
                  ❌ Sem o Método PAUSA
                </span>
                <h3 className="text-lg font-display font-bold text-red-950 mb-4">
                  O Ciclo da Sobrecarga Silenciosa
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-2.5">
                    <span className="text-red-500 font-bold text-sm select-none">✕</span>
                    <div>
                      <h4 className="text-xs min-[390px]:text-sm font-bold text-red-900 leading-tight">Você diz SIM no impulso</h4>
                      <p className="text-[11px] min-[390px]:text-xs text-red-800/80 mt-0.5 leading-relaxed">Age por ansiedade social e medo imediato de decepcionar os outros.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-red-500 font-bold text-sm select-none">✕</span>
                    <div>
                      <h4 className="text-xs min-[390px]:text-sm font-bold text-red-900 leading-tight">Sua agenda vira propriedade alheia</h4>
                      <p className="text-[11px] min-[390px]:text-xs text-red-800/80 mt-0.5 leading-relaxed">Você desmarca seus planos de saúde, lazer e família para fazer favores.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-red-500 font-bold text-sm select-none">✕</span>
                    <div>
                      <h4 className="text-xs min-[390px]:text-sm font-bold text-red-900 leading-tight">O ressentimento cresce por dentro</h4>
                      <p className="text-[11px] min-[390px]:text-xs text-red-800/80 mt-0.5 leading-relaxed">Sente raiva secreta e cansaço extremo por não ser respeitada como gostaria.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-red-500 font-bold text-sm select-none">✕</span>
                    <div>
                      <h4 className="text-xs min-[390px]:text-sm font-bold text-red-900 leading-tight">Sensação de estar sendo usada</h4>
                      <p className="text-[11px] min-[390px]:text-xs text-red-800/80 mt-0.5 leading-relaxed">Você se sente sobrecarregada, esgotada mentalmente e sem energia para o que importa.</p>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="mt-8 pt-5 border-t border-red-200/50 text-[11px] font-bold text-red-800/90 tracking-wide uppercase italic">
                Resultado: Ansiedade, exaustão e perda de controle.
              </div>
            </div>

            {/* O NOVO CAMINHO (FREEDOM & RELIEF) */}
            <div className="bg-emerald-50/45 border-2 border-emerald-500/30 rounded-2xl p-6 min-[390px]:p-8 shadow-sm flex flex-col justify-between relative transform hover:scale-[1.01] transition-transform duration-200">
              
              <div className="absolute top-4 right-4 bg-emerald-600 text-white text-[9px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider animate-pulse">
                Recomendado
              </div>

              <div>
                <span className="inline-block px-3 py-1 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider mb-5">
                  ✨ Com o Método PAUSA
                </span>
                <h3 className="text-lg font-display font-bold text-emerald-950 mb-4">
                  A Liberdade do Posicionamento Claro
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-2.5">
                    <span className="text-emerald-600 font-bold text-sm select-none">✓</span>
                    <div>
                      <h4 className="text-xs min-[390px]:text-sm font-bold text-emerald-900 leading-tight">Você PAUSA antes de falar</h4>
                      <p className="text-[11px] min-[390px]:text-xs text-emerald-850/80 mt-0.5 leading-relaxed">Ganho imediato de tempo emocional para escolher racionalmente.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-emerald-600 font-bold text-sm select-none">✓</span>
                    <div>
                      <h4 className="text-xs min-[390px]:text-sm font-bold text-emerald-900 leading-tight">Usa modelos prontos de frases</h4>
                      <p className="text-[11px] min-[390px]:text-xs text-emerald-850/80 mt-0.5 leading-relaxed">Sem rodeios, sem justificar demais, sem precisar mentir ou ser grossa.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-emerald-600 font-bold text-sm select-none">✓</span>
                    <div>
                      <h4 className="text-xs min-[390px]:text-sm font-bold text-emerald-900 leading-tight">Seu tempo e trabalho passam a valer</h4>
                      <p className="text-[11px] min-[390px]:text-xs text-emerald-850/80 mt-0.5 leading-relaxed">As pessoas passam a respeitar seu posicionamento de forma automática.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-emerald-600 font-bold text-sm select-none">✓</span>
                    <div>
                      <h4 className="text-xs min-[390px]:text-sm font-bold text-emerald-900 leading-tight">Autoestima e leveza de volta</h4>
                      <p className="text-[11px] min-[390px]:text-xs text-emerald-850/80 mt-0.5 leading-relaxed">Sente que é dona absoluta da sua própria rotina, sem carregar o peso dos outros.</p>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="mt-8 pt-5 border-t border-emerald-200/50 text-[11px] font-bold text-emerald-800 tracking-wide uppercase italic">
                Resultado: Leveza, auto-respeito e total controle.
              </div>
            </div>

          </div>

          <div className="text-center mt-12">
            <button
              onClick={scrollToPlanos}
              className="w-full max-w-md bg-burnt text-white font-display font-bold text-[13px] min-[390px]:text-sm md:text-base tracking-wider uppercase py-4 px-8 rounded-lg hover:bg-burnt/95 active:scale-[0.98] transition-all duration-150 shadow-md flex items-center justify-center gap-2 cursor-pointer mx-auto shadow-burnt/10"
            >
              SIM! QUERO MUDAR MEU CAMINHO HOJE
            </button>
          </div>

        </div>
      </section>

      {/* ──────────────────────────────────────────────────────── */}
      {/* 3. SEÇÃO "O QUE É O MÉTODO PAUSA?" */}
      {/* ──────────────────────────────────────────────────────── */}
      <section id="metodo-pausa" className="w-full bg-sand/30 py-16 md:py-24 border-b border-soft-border/50 scroll-mt-6">
        <div className="max-w-4xl mx-auto px-4">
          
          <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
            <span className="text-[11px] font-bold uppercase tracking-widest text-burnt bg-burnt/10 px-3.5 py-1.5 rounded-full">
              UM MÉTODO SIMPLES PARA USAR NA VIDA REAL
            </span>
            <h2 className="text-xl min-[390px]:text-2xl md:text-4xl font-display font-bold text-navy mt-4 leading-tight">
              ANTES DE RESPONDER NO AUTOMÁTICO, <br />
              FAÇA UMA PAUSA.
            </h2>
            <p className="text-xs min-[390px]:text-sm md:text-base text-slate-text mt-4 leading-relaxed">
              O Método PAUSA cria espaço entre o pedido de alguém e a sua resposta. Ele ajuda você a sair do impulso de agradar e escolher com mais clareza o que realmente cabe na sua vida.
            </p>
          </div>

          {/* Visual dos 5 Passos (P-A-U-S-A) */}
          <div className="space-y-4 md:space-y-5 max-w-2xl mx-auto">
            {[
              { letter: "P", name: "PARE", desc: "Você não precisa responder na hora." },
              { letter: "A", name: "AVALIE", desc: "Isso realmente cabe na sua rotina, energia e prioridades?" },
              { letter: "U", name: "USE UMA FRASE CLARA", desc: "Diga o que precisa ser dito sem se explicar demais." },
              { letter: "S", name: "SUSTENTE SUA DECISÃO", desc: "Não volte atrás só porque alguém insistiu." },
              { letter: "A", name: "ACOLHA O DESCONFORTO", desc: "Culpa não é uma ordem para se abandonar." }
            ].map((step, idx) => (
              <div 
                key={idx} 
                className="flex items-start md:items-center gap-4 bg-cream border border-soft-border p-4 rounded-xl shadow-xs hover:border-burnt/30 transition-colors duration-200"
              >
                <span className="w-10 h-10 rounded-lg bg-burnt text-white flex items-center justify-center font-display font-bold text-lg shrink-0 shadow-xs">
                  {step.letter}
                </span>
                <div>
                  <h4 className="text-sm md:text-base font-bold text-navy font-display tracking-wide">
                    {step.name}
                  </h4>
                  <p className="text-xs md:text-sm text-slate-text mt-0.5 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button
              onClick={scrollToOQueVoceRecebe}
              className="w-full max-w-xs bg-burnt text-white font-display font-bold text-[13px] min-[390px]:text-sm tracking-wider uppercase py-4 px-6 rounded-lg hover:bg-burnt/95 active:scale-[0.98] transition-all duration-150 shadow-md flex items-center justify-center gap-2 cursor-pointer mx-auto"
            >
              VEJA TUDO O QUE VOCÊ RECEBE
            </button>
          </div>

        </div>
      </section>

      {/* ──────────────────────────────────────────────────────── */}
      {/* 4. SEÇÃO "TUDO O QUE VOCÊ RECEBE" */}
      {/* ──────────────────────────────────────────────────────── */}
      <section id="o-que-voce-recebe" className="w-full py-16 md:py-24 max-w-7xl mx-auto px-4 scroll-mt-6">
        
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <span className="text-[11px] font-bold uppercase tracking-widest text-burnt bg-burnt/10 px-3.5 py-1.5 rounded-full">
            CONTEÚDO DO GUIA
          </span>
          <h2 className="text-xl min-[390px]:text-2xl md:text-4xl font-display font-bold text-navy mt-4 leading-tight">
            TUDO O QUE VOCÊ RECEBE AO ENTRAR HOJE
          </h2>
        </div>

        {/* Grid de Cards - Organização Premium */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          
          {[
            {
              title: "Método PAUSA",
              desc: "O passo a passo para parar de aceitar tudo no automático.",
              tag: "Metodologia"
            },
            {
              title: "Frases prontas para dizer não",
              desc: "Respostas claras, educadas e firmes para situações reais.",
              tag: "Templates Prontos"
            },
            {
              title: "Como recusar sem se explicar demais",
              desc: "Para favores, convites, cobranças e pedidos.",
              tag: "Comunicação Prática"
            },
            {
              title: "Mini plano de 7 dias",
              desc: "Pequenos exercícios para começar a se posicionar.",
              tag: "Plano Prático"
            },
            {
              title: "Checklist antes de dizer sim",
              desc: "Para perceber se você quer aceitar ou está apenas com medo de decepcionar.",
              tag: "Clareza Mental"
            }
          ].map((item, idx) => (
            <div 
              key={idx} 
              className={`bg-cream border border-soft-border rounded-xl p-6 shadow-sm flex flex-col justify-between hover:border-burnt/25 transition-colors duration-200 ${
                idx === 0 ? "md:col-span-2 lg:col-span-1" : ""
              }`}
            >
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-burnt uppercase tracking-widest block bg-burnt/5 w-fit px-2.5 py-1 rounded">
                  {item.tag}
                </span>
                <h3 className="text-base min-[390px]:text-lg font-display font-bold text-navy">
                  {item.title}
                </h3>
                <p className="text-xs min-[390px]:text-sm text-slate-text leading-relaxed">
                  {item.desc}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-soft-border/40 flex items-center gap-1.5 text-xs text-burnt font-semibold uppercase tracking-wider">
                <Check className="w-4 h-4 text-burnt" /> Incluso
              </div>
            </div>
          ))}

        </div>

        {/* Faixa de Encerramento */}
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

          <div className="text-center mt-12 pt-8 border-t border-cream/10 space-y-6">
            <span className="text-xs min-[390px]:text-sm text-cream/80 tracking-wide font-sans block">
              Não basta entender seus limites. Você precisa praticá-los até eles se tornarem naturais.
            </span>
            <button
              onClick={scrollToPlanos}
              className="w-full max-w-md bg-burnt text-white font-display font-bold text-[13px] min-[390px]:text-sm md:text-base tracking-wider uppercase py-4 px-8 rounded-lg hover:bg-burnt/95 active:scale-[0.98] transition-all duration-150 shadow-md flex items-center justify-center gap-2 cursor-pointer mx-auto"
            >
              VER OS PLANOS E ESCOLHER O MEU
            </button>
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
            ESCOLHA A FORMA QUE FAZ MAIS SENTIDO PARA VOCÊ
          </h2>
          <p className="text-xs min-[390px]:text-sm md:text-base text-slate-text mt-3">
            Oferta de lançamento por tempo limitado. Escolha entre o essencial para começar ou a versão completa para máxima prática.
          </p>
        </div>

        {/* Layout dos Planos */}
        <div className="flex flex-col md:flex-row gap-8 max-w-4xl mx-auto items-stretch justify-center">
          
          {/* PLANO 1 — GUIA ESSENCIAL */}
          <div className="w-full md:w-1/2 bg-cream border border-soft-border rounded-2xl p-6 min-[390px]:p-8 shadow-sm flex flex-col justify-between transform hover:scale-[1.01] transition-transform order-2 md:order-1">
            
            <div>
              <div className="mb-6 space-y-1">
                <span className="text-[10px] font-bold text-slate-text uppercase tracking-widest">Acesso Básico</span>
                <h3 className="text-lg md:text-xl font-display font-bold text-navy">GUIA ESSENCIAL</h3>
              </div>

              <div className="mb-6 space-y-2">
                <p className="text-xs text-navy/60 font-semibold">
                  De <span className="line-through">R$ 47,00</span> por apenas:
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-burnt">R$</span>
                  <span className="text-4xl min-[390px]:text-5xl font-display font-extrabold text-burnt leading-none">19,90</span>
                </div>
                <p className="text-xs text-slate-text font-medium">
                  Pagamento único • Acesso imediato • Garantia de 7 dias
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
                /* Para reativar o Upsell no futuro, altere a linha abaixo de volta para: onClick={() => openUpsell(triggerButtonRef)} */
                onClick={handleBuyBasicDirectly}
                className="w-full bg-navy text-cream font-display font-bold text-[13px] min-[390px]:text-sm md:text-base tracking-wider uppercase py-4 px-6 rounded-lg hover:bg-navy/95 active:scale-[0.98] transition-all duration-150 min-h-[52px] shadow-sm flex items-center justify-center gap-2 cursor-pointer text-center"
              >
                QUERO O GUIA ESSENCIAL POR R$19,90
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
          <div className="w-full md:w-1/2 bg-[#FCF8F2] border-2 border-burnt rounded-2xl p-6 min-[390px]:p-8 shadow-md flex flex-col justify-between relative transform hover:scale-[1.01] transition-transform order-1 md:order-2">
            
            <div className="absolute -top-4 right-6 bg-burnt text-white text-[9px] min-[390px]:text-[10px] font-bold px-3 py-1 rounded-full tracking-wider uppercase shadow-sm">
              Mais Completo
            </div>

            <div>
              <div className="mb-6 space-y-1">
                <span className="text-[10px] font-bold text-slate-text uppercase tracking-widest">Opção Recomendada</span>
                <h3 className="text-lg md:text-xl font-display font-bold text-navy">PLANO COMPLETO</h3>
              </div>

              <div className="mb-6 space-y-2">
                <p className="text-xs text-navy/60 font-semibold">
                  De <span className="line-through">R$ 97,00</span> por apenas:
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-burnt">R$</span>
                  <span className="text-4xl min-[390px]:text-5xl font-display font-extrabold text-burnt leading-none">29,90</span>
                </div>
                <p className="text-xs text-slate-text font-medium">
                  Pagamento único • Acesso imediato • Garantia de 7 dias
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
                className="w-full bg-burnt text-white font-display font-bold text-[13px] min-[390px]:text-sm md:text-base tracking-wider uppercase py-4 px-6 rounded-lg hover:bg-burnt/95 active:scale-[0.98] transition-all duration-150 min-h-[52px] shadow-sm flex items-center justify-center gap-2 cursor-pointer text-center animate-pulse-subtle"
              >
                QUERO O PLANO COMPLETO POR R$29,90
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
      {/* 5.5. AUTORIDADE — QUEM CRIOU O MÉTODO PAUSA? */}
      {/* ──────────────────────────────────────────────────────── */}
      <section className="w-full bg-cream py-16 md:py-24 border-b border-soft-border/50">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
          
          <div className="md:col-span-5">
            <div className="overflow-hidden rounded-xl border border-soft-border/60 bg-white shadow-sm">
              <img 
                src="https://i.ibb.co/V02jfQWb/Arlinda-Souza-Especialista.webp" 
                alt="Arlinda Souza - Criadora do Método PAUSA" 
                className="w-full h-auto object-cover aspect-[4/5] md:aspect-auto"
                loading="lazy"
                referrerPolicy="no-referrer"
                width="400"
                height="500"
              />
            </div>
          </div>

          <div className="md:col-span-7 space-y-4 text-left">
            <span className="text-[11px] font-bold uppercase tracking-widest text-burnt bg-burnt/10 px-3.5 py-1.5 rounded-full">
              QUEM CRIOU O MÉTODO PAUSA?
            </span>
            <h2 className="text-xl min-[390px]:text-2xl md:text-4xl font-display font-bold text-navy leading-tight pt-2">
              Arlinda Souza
            </h2>
            <p className="text-xs min-[390px]:text-sm md:text-base text-slate-text leading-relaxed font-sans">
              Arlinda Souza é especialista em comportamento, comunicação assertiva e limites saudáveis. Após anos ajudando pessoas a superarem a estafa profissional e o esgotamento por excesso de responsabilidade, desenvolveu o Método PAUSA: uma abordagem prática para quem deseja se posicionar sem brigar, sem se justificar e, principalmente, sem carregar a culpa por dizer não.
            </p>
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

        {/* Botão Final pós-FAQ de Quero Comprar para rolar de volta para os planos */}
        <div className="text-center mt-12">
          <button
            onClick={scrollToPlanos}
            className="w-full max-w-md bg-burnt text-white font-display font-bold text-[13px] min-[390px]:text-sm md:text-base tracking-wider uppercase py-4 px-8 rounded-lg hover:bg-burnt/95 active:scale-[0.98] transition-all duration-150 shadow-md flex items-center justify-center gap-2 cursor-pointer mx-auto"
          >
            QUERO COMPRAR • ESCOLHER MEU PLANO
          </button>
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
                  Por apenas mais R$10,00, leve o Plano Completo por R$29,90.
                </h3>
                <p className="text-xs min-[390px]:text-sm text-slate-text leading-relaxed">
                  Você já escolheu o Guia Essencial. Com esta oportunidade única de upgrade, adicione todas as ferramentas do Plano Completo por apenas R$29,90 (economize R$10,00 na diferença)!
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
                  <span className="text-base min-[390px]:text-lg font-bold text-slate-text/90">R$ 19,90</span>
                </div>
                <div className="bg-burnt/5 border border-burnt/35 rounded-lg p-3 text-center">
                  <span className="text-[10px] font-bold text-burnt uppercase tracking-wider block">Plano Completo</span>
                  <span className="text-base min-[390px]:text-lg font-bold text-burnt">R$ 29,90</span>
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
                Sim, quero o Plano Completo por R$29,90
              </button>

              <button
                onClick={handleDeclineUpgrade}
                className="w-full bg-cream border border-navy/70 text-navy font-display font-bold text-[12px] min-[390px]:text-[13px] tracking-wider uppercase py-3.5 rounded-lg hover:bg-sand/30 active:scale-[0.98] transition-all duration-150 min-h-[48px] flex items-center justify-center cursor-pointer"
              >
                Continuar apenas com o Guia Essencial por R$19,90
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
                <span className="text-sm font-bold text-white">Por apenas R$ 19,90</span>
              </div>
              <button
                onClick={() => {
                  const ofertaSection = document.getElementById("planos");
                  if (ofertaSection) {
                    ofertaSection.scrollIntoView({ behavior: "smooth" });
                  }
                  trackCustomPixel("FloatingCtaClicked", { price: 19.90 });
                }}
                className="w-full md:w-auto bg-burnt text-white font-display font-bold text-xs tracking-wider uppercase py-3 px-6 rounded-lg hover:bg-burnt/95 active:scale-95 transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
              >
                QUERO COMEÇAR POR R$19,90
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
