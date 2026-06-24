import { Check, ShieldAlert, ArrowLeft, ExternalLink, HelpCircle, ShieldCheck } from "lucide-react";

// Links criptografados em Base64 invertido para segurança absoluta (impede inspeção direta ou scrapers de achar "drive.google.com")
const ENCODED_LINKS = {
  basic: "r5Was9VZyFGaz1DczV3Pfd2SBlkWOVjQBxURlp1axUWa0xUcQdlYL5GWtUjQYJWMvMnclRGbvZ2LlZXayR2Lt92YuUGbn92bn5SZ2lmck9yL6MHc0RHa",
  premium: "r5Was9VZyFGaz1DczV3PFhGRhdGbZRGcN1SRodDOqNncZRFW2gWcyokdmRXW2QVMvMnclRGbvZ2LlZXayR2Lt92YuUGbn92bn5SZ2lmck9yL6MHc0RHa"
};

// Decodificador seguro que inverte e depois decodifica o Base64
const decodeUrl = (encoded: string): string => {
  try {
    const reversed = encoded.split("").reverse().join("");
    return atob(reversed);
  } catch (error) {
    console.error("Erro na decodificação de segurança:", error);
    return "";
  }
};

interface SecureRedirectsProps {
  type: "basic" | "premium" | "cancelled";
  onBackToPlans: () => void;
}

export default function SecureRedirects({ type, onBackToPlans }: SecureRedirectsProps) {
  const handleAccessProduct = () => {
    const encoded = type === "basic" ? ENCODED_LINKS.basic : ENCODED_LINKS.premium;
    const url = decodeUrl(encoded);
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  if (type === "cancelled") {
    return (
      <div className="min-h-screen bg-sand flex flex-col items-center justify-center p-4 font-sans select-none" id="cancelled-page-container">
        <div className="w-full max-w-md bg-cream rounded-2xl border border-soft-border/60 p-8 shadow-md text-center space-y-6 animate-fade-in">
          {/* Ícone Alerta */}
          <div className="mx-auto w-16 h-16 rounded-full bg-burnt/10 flex items-center justify-center text-burnt border border-burnt/15" id="cancelled-icon-container">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] md:text-xs font-bold text-burnt uppercase tracking-widest bg-burnt/10 px-2.5 py-1 rounded">
              Transação Cancelada
            </span>
            <h1 className="text-xl md:text-2xl font-display font-bold text-navy leading-tight pt-2">
              Sua compra foi cancelada ou o tempo expirou
            </h1>
            <p className="text-xs md:text-sm text-slate-text leading-relaxed">
              Não se preocupe! Nenhum valor foi cobrado e o seu carrinho está seguro. Se você deseja revisar os nossos planos e garantir o seu acesso ao Método PAUSA, clique no botão abaixo.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={onBackToPlans}
              id="cta-cancelled-back"
              className="w-full bg-burnt text-white font-display font-bold text-xs md:text-sm tracking-wider uppercase py-4 px-6 rounded-lg hover:bg-burnt/95 active:scale-[0.98] transition-all duration-150 min-h-[52px] shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Ver Opções de Planos
            </button>
          </div>

          <div className="pt-4 border-t border-soft-border/40 flex flex-col items-center space-y-1 text-[11px] text-slate-text">
            <span className="flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-burnt" />
              Precisa de ajuda com o pagamento?
            </span>
            <span className="font-semibold text-navy">suporte@metodopausa.com.br</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand flex flex-col items-center justify-center p-4 font-sans select-none" id={`success-${type}-page-container`}>
      <div className="w-full max-w-lg bg-cream rounded-2xl border border-soft-border/60 p-8 md:p-10 shadow-md text-center space-y-7 animate-fade-in">
        {/* Ícone Sucesso */}
        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 border border-emerald-500/15" id="success-icon-container">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <div className="space-y-3">
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/15 text-emerald-600 text-[10px] md:text-xs font-bold tracking-widest uppercase">
            <Check className="w-3 h-3" /> Compra Realizada com Sucesso
          </div>
          
          <h1 className="text-2xl md:text-3xl font-display font-bold text-navy leading-tight">
            Parabéns pela sua compra!
          </h1>
          
          <p className="text-xs md:text-sm text-slate-text leading-relaxed">
            {type === "basic" ? (
              <>
                Seu acesso ao <strong className="text-navy font-semibold">Guia Essencial do Método PAUSA</strong> foi liberado! Prepare-se para aprender a recusar pedidos abusivos e impor limites com total leveza e sem culpa.
              </>
            ) : (
              <>
                Seu acesso ao <strong className="text-navy font-semibold">Plano Completo do Método PAUSA</strong> (Guia Essencial + Todos os Bônus Exclusivos) foi liberado! Prepare-se para dominar a arte do posicionamento com todas as nossas ferramentas de apoio.
              </>
            )}
          </p>
        </div>

        {/* Box informativo sobre entrega */}
        <div className="bg-sand/40 border border-soft-border/60 rounded-xl p-4 text-left text-xs md:text-sm text-navy/90 space-y-2">
          <div className="font-bold text-navy flex items-center gap-1">
            <Check className="w-4 h-4 text-burnt" /> O que você recebe:
          </div>
          <ul className="space-y-1.5 text-slate-text pl-5 list-disc">
            {type === "basic" ? (
              <li>Guia Completo Método PAUSA em PDF de Alta Qualidade</li>
            ) : (
              <>
                <li>Guia Completo Método PAUSA em PDF de Alta Qualidade</li>
                <li>Mapa Mental Prático "Como Dizer Não"</li>
                <li>Roteiro Exclusivo de Reforço Pós-Recusa</li>
                <li>Áudio Diário de Fortalecimento Emocional</li>
                <li>Guia de 25 Situações Desconfortáveis Resolvidas</li>
              </>
            )}
          </ul>
        </div>

        <div className="pt-2">
          <button
            onClick={handleAccessProduct}
            id="cta-access-product"
            className="w-full bg-burnt text-white font-display font-bold text-xs md:text-sm tracking-wider uppercase py-4.5 px-6 rounded-lg hover:bg-burnt/95 active:scale-[0.98] transition-all duration-150 min-h-[56px] shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            Acessar Meu Produto
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[10px] md:text-xs text-slate-text italic leading-snug">
          Importante: O seu link de acesso é de uso pessoal e intransferível. Recomendamos que você salve a pasta do Google Drive nos seus favoritos para garantir o acesso sempre que precisar.
        </p>

        <div className="pt-4 border-t border-soft-border/40 flex flex-col items-center space-y-1 text-[11px] text-slate-text">
          <span>Dúvidas ou problemas com o download? Fale conosco:</span>
          <span className="font-semibold text-navy">suporte@metodopausa.com.br</span>
        </div>
      </div>
    </div>
  );
}
