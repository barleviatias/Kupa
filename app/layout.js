import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "מנוע חיפוש קופה ראשית",
  description: "מחפשים משפט אהוב מהסדרה קופה ראשית? לא יודעים באיזה פרק הוא נאמר?\n  אפליקציית קופה ראשית כאן כדי לעזור!\n  הזינו משפט מהסדרה, והאפליקציה תחזיר לכם את כל הפרקים שבהם הוא מופיע",
};
export const dynamic = 'force-dynamic'
// 'auto' | 'force-dynamic' | 'error' | 'force-static'

export default function RootLayout({ children }) {
  return (
    <html lang="en" dir="rtl">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
