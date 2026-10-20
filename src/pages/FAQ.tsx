import { useState, useEffect } from "react";
import { getFAQs as getLocalFAQs } from "@/lib/stores/faqStore";
import { getFAQs as getRemoteFAQs } from "@/lib/services/faqService";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category?: string | null;
  order_index?: number;
}

const FAQ = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    try {
      const remote = await getRemoteFAQs();
      if (remote && remote.length > 0) {
        setFaqs(remote.map((r: any) => ({
          id: r.id,
          question: r.question,
          answer: r.answer,
          category: r.category,
          order_index: r.order_index ?? 0,
        })));
        setLoading(false);
        return;
      }
    } catch (_e) {}
    try {
      const data = await getLocalFAQs();
      setFaqs((data as any[]).map((d: any) => ({
        id: d.id,
        question: d.question,
        answer: d.answer,
        category: d.category ?? null,
        order_index: d.order_index ?? 0,
      })));
    } catch (error) {
      console.error("Error fetching FAQs:", error);
    } finally {
      setLoading(false);
    }
  };

  const categories = faqs.reduce((acc, faq) => {
    const category = faq.category || "General";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(faq);
    return acc;
  }, {} as Record<string, FAQ[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navbar />
      
      <main className="container mx-auto px-4 py-24 max-w-4xl">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-muted-foreground">
            Find answers to common questions about our tech club
          </p>
        </div>

        {loading ? (
          <Card className="p-8 animate-pulse">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i}>
                  <div className="h-6 bg-muted rounded mb-2" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                </div>
              ))}
            </div>
          </Card>
        ) : Object.keys(categories).length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-xl text-muted-foreground">No FAQs available yet.</p>
          </Card>
        ) : (
          <div className="space-y-12">
            {Object.entries(categories).map(([category, categoryFaqs]) => (
              <div key={category}>
                <h2 className="text-2xl font-bold mb-6">{category}</h2>
                <Accordion type="single" collapsible className="space-y-4">
                  {categoryFaqs.map((faq) => (
                    <AccordionItem key={faq.id} value={faq.id} className="border rounded-lg px-6">
                      <AccordionTrigger className="text-left hover:no-underline">
                        <span className="font-semibold">{faq.question}</span>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default FAQ;