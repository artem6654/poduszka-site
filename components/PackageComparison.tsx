import { Reveal } from './Reveal';
import { formatPLN, getQuote } from '@/lib/pricing';

export function PackageComparison() {
  const single = getQuote('single');
  const bundle = getQuote('bundle');
  const twoSingles = single.total * bundle.quantity;

  return (
    <section className="section compare" aria-labelledby="compare-title">
      <div className="wrap compare-grid">
        <Reveal className="compare-copy">
          <p className="eyebrow">Porównanie</p>
          <h2 id="compare-title" className="h2">
            Jak wybrać zestaw.
          </h2>
          <p className="body">
            Zestaw to ta sama poduszka w dwóch egzemplarzach. Zakup dwóch pojedynczych sztuk kosztuje {formatPLN(twoSingles)},
            a zestaw {formatPLN(bundle.total)}. Różnica to {formatPLN(bundle.savings)}.
          </p>
        </Reveal>

        <Reveal delay={120} className="compare-table-wrap">
          <table className="compare-table">
            <caption className="sr-only">Porównanie wariantu jednej poduszki i zestawu dwóch poduszek</caption>
            <thead>
              <tr>
                <th scope="col">
                  <span className="sr-only">Parametr</span>
                </th>
                <th scope="col">{single.title}</th>
                <th scope="col">{bundle.title}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Łączna cena</th>
                <td>{formatPLN(single.total)}</td>
                <td>{formatPLN(bundle.total)}</td>
              </tr>
              <tr>
                <th scope="row">Cena za sztukę</th>
                <td>{formatPLN(single.unitPrice)}</td>
                <td>{formatPLN(bundle.unitPrice)}</td>
              </tr>
              <tr>
                <th scope="row">Oszczędność względem zakupu pojedynczych sztuk</th>
                <td>Nie dotyczy</td>
                <td className="compare-highlight">{formatPLN(bundle.savings)}</td>
              </tr>
              <tr>
                <th scope="row">Pianka, pokrowiec i wymiary</th>
                <td>Te same</td>
                <td>Te same</td>
              </tr>
            </tbody>
          </table>
        </Reveal>
      </div>
    </section>
  );
}
