const rows = [
  { feature: 'Monthly cost',   barpel: 'From $29',    gorgias: 'From $60',    va: '$300–800' },
  { feature: 'Voice calls',    barpel: '✓ Yes',       gorgias: '✗ No',        va: '✓ Yes' },
  { feature: '24/7 coverage',  barpel: '✓ Always',    gorgias: '✗ Text only', va: '✗ Time zones' },
  { feature: 'Setup time',     barpel: '5 minutes',   gorgias: 'Days',        va: '1–2 weeks' },
  { feature: 'Cart recovery',  barpel: '✓ Automated', gorgias: '✗ Manual',    va: '✗ Manual' },
  { feature: 'Languages',      barpel: '30+',         gorgias: 'Limited',     va: '1–2' },
  { feature: 'Chargeback risk',barpel: 'Low',         gorgias: 'Medium',      va: 'Medium' },
];

export default function Compare() {
  return (
    <section className="section-padding bg-off-white">
      <div className="container-default">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="heading-section text-brand-navy mb-4">
            Barpel AI vs.{' '}
            <span className="text-brand-teal">the alternatives</span>
          </h2>
          <p className="body-large text-text-secondary">
            See how Barpel AI compares to Gorgias and hiring a virtual assistant for e-commerce customer support.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="text-left py-4 px-5 text-text-secondary font-medium w-1/4" scope="col">
                  Feature
                </th>
                <th className="py-4 px-5 text-center font-bold text-brand-navy bg-brand-teal/10 rounded-t-xl border-x border-t border-brand-teal/20 w-1/4" scope="col">
                  Barpel AI
                </th>
                <th className="py-4 px-5 text-center text-text-secondary font-medium w-1/4" scope="col">
                  Gorgias
                </th>
                <th className="py-4 px-5 text-center text-text-secondary font-medium w-1/4" scope="col">
                  Hiring a VA
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.feature}
                  className={i % 2 === 0 ? 'bg-white' : 'bg-off-white/60'}
                >
                  <td className="py-4 px-5 text-brand-navy font-medium">{row.feature}</td>
                  <td className={`py-4 px-5 text-center font-semibold bg-brand-teal/5 border-x border-brand-teal/20 ${row.barpel.startsWith('✓') ? 'text-brand-teal' : 'text-brand-navy'}`}>
                    {row.barpel}
                  </td>
                  <td className={`py-4 px-5 text-center ${row.gorgias.startsWith('✗') ? 'text-text-muted' : 'text-text-secondary'}`}>
                    {row.gorgias}
                  </td>
                  <td className={`py-4 px-5 text-center ${row.va.startsWith('✗') ? 'text-text-muted' : 'text-text-secondary'}`}>
                    {row.va}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="py-2" />
                <td className="py-2 bg-brand-teal/5 border-x border-b border-brand-teal/20 rounded-b-xl" />
                <td className="py-2" />
                <td className="py-2" />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </section>
  );
}
