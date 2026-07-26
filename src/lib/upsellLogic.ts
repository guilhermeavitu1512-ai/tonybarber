import { ProductRecommendation } from '../types';

export function getSmartUpsellProducts(
  products: any[],
  recommendations: ProductRecommendation[], 
  serviceId: string, 
  historyProductIds: string[], 
  lastAppointmentProductIds: string[],
  favoriteProductIds: string[]
) {
  const serviceRecs = recommendations.filter(r => r.serviceId === serviceId && r.isActive);
  
  const scoredProducts = products.map(product => {
    let score = 0;
    let label = '';
    
    // Base recommendation score
    const rec = serviceRecs.find(r => r.productId === product.id);
    if (rec) {
      score += rec.priority;
      label = rec.label || 'Recomendado para este serviço';
    }
    
    // History scoring
    if (historyProductIds.includes(product.id)) {
      score += 30;
      if (!label) label = 'Você já comprou este produto';
    }
    
    if (lastAppointmentProductIds.includes(product.id)) {
      score += 20;
      if (!label) label = 'Escolhido no último atendimento';
    }
    
    if (favoriteProductIds.includes(product.id)) {
      score += 20;
      if (!label) label = 'Salvo no Meu Estilo';
    }
    
    return { ...product, score, label };
  });

  return scoredProducts.sort((a, b) => b.score - a.score);
}
