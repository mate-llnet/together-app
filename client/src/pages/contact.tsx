import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, MapPin, Clock, Send, Heart } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().min(5, "Subject must be at least 5 characters").optional(),
  message: z.string().min(10, "Message must be at least 10 characters")
});

type ContactFormData = z.infer<typeof contactSchema>;

const contactInfo = [
  {
    icon: Mail,
    title: "Email Us",
    content: "hello@appreciatemate.com",
    description: "We'll get back to you within 24 hours"
  },
  {
    icon: Phone,
    title: "Call Us",
    content: "+1 (555) 123-4567",
    description: "Monday to Friday, 9 AM to 6 PM EST"
  },
  {
    icon: MapPin,
    title: "Visit Us",
    content: "123 Love Street, Heart City, HC 12345",
    description: "By appointment only"
  },
  {
    icon: Clock,
    title: "Support Hours",
    content: "24/7 Online Support",
    description: "Always here when you need us"
  }
];

const faqItems = [
  {
    question: "Is AppreciateMate free to use?",
    answer: "Yes! AppreciateMate offers a generous free tier that includes all core features. Premium plans are available for advanced analytics and insights."
  },
  {
    question: "How does AppreciateMate protect our privacy?",
    answer: "We take privacy seriously. All your data is encrypted and never shared with third parties. You control your information completely."
  },
  {
    question: "Can we use AppreciateMate on different devices?",
    answer: "Absolutely! AppreciateMate works seamlessly across all your devices - phone, tablet, and computer. Your data stays synced automatically."
  },
  {
    question: "What if my partner doesn't want to use the app?",
    answer: "You can still use AppreciateMate to track your own contributions and reflections. Many users find that their partners join naturally over time."
  }
];

export default function Contact() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: siteSettings } = useQuery({
    queryKey: ['/api/site/settings'],
    enabled: false // We'll enable this once we create the API endpoints
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema)
  });

  const contactMutation = useMutation({
    mutationFn: (data: ContactFormData) => 
      fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      }).then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "Message Sent!",
        description: "Thank you for reaching out. We'll get back to you within 24 hours.",
      });
      reset();
      setIsSubmitting(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
      setIsSubmitting(false);
    }
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    contactMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/10 dark:to-blue-900/10" />
        <div className="relative container mx-auto px-4 py-20 lg:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-20 h-20 bg-gradient-warm rounded-2xl flex items-center justify-center mx-auto mb-8 transform rotate-3 hover:rotate-6 transition-transform duration-300">
              <Mail className="h-10 w-10 text-white" />
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold mb-6 bg-gradient-to-br from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent" data-testid="contact-hero-title">
              Get in Touch
            </h1>
            
            <p className="text-xl lg:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed" data-testid="contact-hero-description">
              Have questions about AppreciateMate? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form and Info Section */}
      <section className="py-20 lg:py-32" data-testid="section-contact-form">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16">
              {/* Contact Form */}
              <Card className="border-0 shadow-lg" data-testid="contact-form-card">
                <CardHeader>
                  <CardTitle className="text-3xl font-bold flex items-center gap-3" data-testid="form-title">
                    <Heart className="h-8 w-8 text-purple-600" />
                    Send us a Message
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" data-testid="contact-form">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" data-testid="label-name">Name *</Label>
                        <Input
                          id="name"
                          type="text"
                          placeholder="Your name"
                          data-testid="input-name"
                          {...register("name")}
                          className={errors.name ? "border-red-500" : ""}
                        />
                        {errors.name && (
                          <p className="text-sm text-red-500" data-testid="error-name">
                            {errors.name.message}
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email" data-testid="label-email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your.email@example.com"
                          data-testid="input-email"
                          {...register("email")}
                          className={errors.email ? "border-red-500" : ""}
                        />
                        {errors.email && (
                          <p className="text-sm text-red-500" data-testid="error-email">
                            {errors.email.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject" data-testid="label-subject">Subject</Label>
                      <Input
                        id="subject"
                        type="text"
                        placeholder="What's this about?"
                        data-testid="input-subject"
                        {...register("subject")}
                        className={errors.subject ? "border-red-500" : ""}
                      />
                      {errors.subject && (
                        <p className="text-sm text-red-500" data-testid="error-subject">
                          {errors.subject.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" data-testid="label-message">Message *</Label>
                      <Textarea
                        id="message"
                        rows={6}
                        placeholder="Tell us how we can help..."
                        data-testid="input-message"
                        {...register("message")}
                        className={errors.message ? "border-red-500" : ""}
                      />
                      {errors.message && (
                        <p className="text-sm text-red-500" data-testid="error-message">
                          {errors.message.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      disabled={isSubmitting}
                      className="w-full bg-gradient-warm hover:opacity-90 text-white py-6 text-lg rounded-xl"
                      data-testid="button-submit"
                    >
                      {isSubmitting ? (
                        "Sending..."
                      ) : (
                        <>
                          Send Message <Send className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl font-bold mb-6" data-testid="contact-info-title">
                    Contact Information
                  </h2>
                  <p className="text-lg text-muted-foreground leading-relaxed mb-8" data-testid="contact-info-description">
                    We're here to help make your relationship journey smoother. Reach out through any of these channels.
                  </p>
                </div>

                <div className="grid gap-6">
                  {contactInfo.map((info, index) => (
                    <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300" data-testid={`contact-info-${index}`}>
                      <CardContent className="p-6 flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-warm rounded-lg flex items-center justify-center flex-shrink-0">
                          <info.icon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg mb-1" data-testid={`contact-title-${index}`}>
                            {info.title}
                          </h3>
                          <p className="font-medium text-purple-600 mb-2" data-testid={`contact-content-${index}`}>
                            {info.content}
                          </p>
                          <p className="text-sm text-muted-foreground" data-testid={`contact-description-${index}`}>
                            {info.description}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10" data-testid="section-faq">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6" data-testid="faq-title">
                Frequently Asked Questions
              </h2>
              <p className="text-xl text-muted-foreground">
                Quick answers to questions you might have
              </p>
            </div>

            <div className="space-y-6">
              {faqItems.map((item, index) => (
                <Card key={index} className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm" data-testid={`faq-item-${index}`}>
                  <CardContent className="p-8">
                    <h3 className="text-xl font-semibold mb-3" data-testid={`faq-question-${index}`}>
                      {item.question}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed" data-testid={`faq-answer-${index}`}>
                      {item.answer}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}