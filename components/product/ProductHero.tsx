import { brand, product } from '@/config/store';
import { WaveEdge } from '@/components/background/WaveEdge';
import { ProductGallery } from './ProductGallery';
import { PurchasePanel } from './PurchasePanel';

type Props = {
  paymentsConfigured: boolean;
};

/** Sekcja produktu: nagłówek i galeria po lewej, karta zakupu po prawej (na telefonie pod zdjęciem). */
export function ProductHero({ paymentsConfigured }: Props) {
  return (
    <section id="produkt" className="product-hero has-deco grain" aria-labelledby="product-title">
      <span className="glow glow--hero" aria-hidden="true" />
      <div className="wrap product-grid">
        <div className="product-main">
          <header className="product-head">
            <p className="product-brand">Dostępne w sklepie {brand.name}</p>
            <h1 id="product-title" className="product-title">
              {product.name}
            </h1>
            <p className="product-headline">{product.headline}</p>
            <p className="product-desc">{product.description}</p>
          </header>
          <ProductGallery />
        </div>
        <div className="product-buy">
          <PurchasePanel paymentsConfigured={paymentsConfigured} />
        </div>
      </div>
      <WaveEdge fill="#E9DFCF" />
    </section>
  );
}
