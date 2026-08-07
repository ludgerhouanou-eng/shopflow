import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ShopFlow — La plateforme e-commerce simple et rapide pour les commerçants d’Afrique francophone',
  description: 'Créez votre boutique en ligne, vendez sur WhatsApp et gérez votre stock et vos paiements Mobile Money facilement.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
