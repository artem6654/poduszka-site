import { packageCopy, product } from '@/config/store';
import { formatPLN, getQuote } from '@/lib/pricing';

export function AnnouncementBar() {
  const bundle = getQuote('bundle');

  return (
    <div className="announce">
      <p>
        {product.shortName}: {packageCopy.bundle.title} za {formatPLN(bundle.total)}, oszczędzasz {formatPLN(bundle.savings)}.
      </p>
    </div>
  );
}
