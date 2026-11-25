export const metadata = { title: 'Shristi | Literature Club', description: 'A student circle for reading, writing and discovering new voices.' };
export default function Layout({children}) {
  return <html lang="en"><head><link rel="stylesheet" href="/club.css" /></head><body>{children}</body></html>;
}
