# Style Guide SIPOMA

## Atomic Design Structure

- **Atoms**: Komponen UI terkecil (Button, Icon, Input)
- **Molecules**: Gabungan atom (FormField, Card)
- **Organisms**: Bagian UI kompleks (Sidebar, Header)
- **Templates**: Layout halaman
- **Pages**: Halaman aplikasi

## Design Tokens

Gunakan `styles/design-tokens.css` untuk konsistensi warna, font, dan layout.

## Coding Standards

- TypeScript strict
- Functional components
- Memoization & lazy loading
- Responsive & accessible (WCAG 2.1)

## Komponen Reusable

- Dokumentasikan props dan contoh penggunaan
- Gunakan folder `components/atoms`, `molecules`, `organisms`, `templates`

## Testing

- Unit test: setiap atom/molecule
- Integration test: organism/template

## Error Handling

- Gunakan ErrorBoundary
- Loading skeleton untuk async UI

## Deployment

- Pipeline: lint, format, test, build, deploy

## Referensi

- [Atomic Design](https://bradfrost.com/blog/post/atomic-web-design/)
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
