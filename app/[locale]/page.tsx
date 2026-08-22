// Components
import { InvoiceMain } from "@/app/components";

export default function Home() {
    return (
        // `pb-28 xl:pb-10` clears the sticky MobileActionBar, which only
        // renders below xl.
        <main className="container py-6 pb-28 md:py-10 xl:pb-10">
            <InvoiceMain />
        </main>
    );
}
