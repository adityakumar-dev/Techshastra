import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin, Linkedin, Instagram, Send, CheckCircle2 } from "lucide-react";
import { submitContactMessage } from "@/lib/services/messageService";
import { useToast } from "@/hooks/use-toast";

const contactInfo = [
  { icon: Mail, label: "Email", value: "vmsb.utu.ddn.2023@gmail.com", link: "mailto:vmsb.utu.ddn.2023@gmail.com" },
  { icon: Phone, label: "Phone", value: "+91 7817030426", link: "tel:+917817030426" },
  { icon: Phone, label: "Alternative", value: "+91 7439587546", link: "tel:+917439587546" },
  { icon: MapPin, label: "Location", value: "UTU Dehradun, Uttarakhand", link: "https://maps.google.com/?q=Uttarakhand+Technical+University" },
];

const socialLinks = [
  { icon: Linkedin, label: "LinkedIn", link: "https://www.linkedin.com/company/tech-shastra/" },
  { icon: Instagram, label: "Instagram", link: "https://www.instagram.com/techshastra_utu" },
];


const Contact = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await submitContactMessage({
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
      });

      setSubmitted(true);
      toast({
        title: "Message Sent",
        description: "We've received your message and will get back to you soon.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="py-24 px-4 bg-background">
      <div className="container mx-auto max-w-5xl">
        {/* Section Header */}
        <div className="text-center mb-20 space-y-4">
          <h2 className="text-3xl md:text-5xl font-heading font-light tracking-wider text-foreground">
            Contact Authority
          </h2>
          <div className="space-y-2">
            <p className="text-sm font-light tracking-[0.2em] uppercase text-primary/60">
              For collaborations, partnerships, and institutional coordination
            </p>
            <p className="text-base font-light text-foreground/50 max-w-2xl mx-auto tracking-wide italic">
              "Direct access to leadership for strategic inquiries and partnerships."
            </p>
          </div>
        </div>

        {/* Form and Info Grid */}
        <div className="grid lg:grid-cols-5 gap-12 mb-20">
          {/* Contact Form */}
          <div className="lg:col-span-3">
            {submitted ? (
              <Card className="h-full flex flex-col items-center justify-center p-10 text-center space-y-6 bg-primary/5 border-primary/20 rounded-3xl">
                <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">Thank You!</h3>
                  <p className="text-muted-foreground">Your message has been successfully delivered to our team.</p>
                </div>
                <Button variant="outline" onClick={() => setSubmitted(false)}>Send Another Message</Button>
              </Card>
            ) : (
              <Card className="border-0 shadow-xl shadow-primary/5 rounded-3xl overflow-hidden">
                <CardHeader className="bg-primary/5 pb-8">
                  <CardTitle>Send a Message</CardTitle>
                  <CardDescription>Fill out the form below and we'll get back to you as soon as possible.</CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          placeholder="John Doe"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="john@example.com"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        placeholder="Inquiry about..."
                        required
                        value={formData.subject}
                        onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Your Message</Label>
                      <Textarea
                        id="message"
                        placeholder="Write your message here..."
                        rows={5}
                        required
                        value={formData.message}
                        onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                      />
                    </div>
                    <Button type="submit" className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20" disabled={loading}>
                      {loading ? "Sending..." : (
                        <span className="flex items-center gap-2">
                          <Send className="w-5 h-5" /> Send Message
                        </span>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Quick Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="glass rounded-3xl border-0 p-8 space-y-8 h-full">
              <div className="space-y-6">
                <h3 className="text-xl font-heading font-light tracking-wider">Office Details</h3>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Headquarters</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Uttarakhand Technical University, SUDHOWALA<br />
                      Post Office Chandanwadi, Prem Nagar<br />
                      Dehradun, Uttarakhand
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">General Support</p>
                    <p className="text-xs text-muted-foreground mt-1">vmsb.utu.ddn.2023@gmail.com</p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-foreground/5">
                <p className="text-xs font-light tracking-widest uppercase text-foreground/30 mb-4">Connect With Us</p>
                <div className="flex gap-3">
                  {socialLinks.map((social, index) => {
                    const Icon = social.icon;
                    return (
                      <Button
                        key={index}
                        variant="ghost"
                        size="icon"
                        className="w-10 h-10 rounded-xl bg-muted hover:bg-primary/20 text-muted-foreground hover:text-primary transition-all overflow-hidden"
                        asChild
                      >
                        <a href={social.link} target="_blank" rel="noopener noreferrer">
                          <Icon className="w-5 h-5" />
                        </a>
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-6 border-t border-foreground/5">
                <h4 className="text-xs font-bold text-primary mb-2 uppercase tracking-tighter">Response Time</h4>
                <p className="text-[10px] text-muted-foreground italic">
                  Our core team typically responds to strategic inquiries within 24-48 business hours.
                </p>
              </div>
            </Card>
          </div>
        </div>


      </div>
    </section>
  );
};

export default Contact;
