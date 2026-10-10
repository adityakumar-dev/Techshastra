import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getEventById as getLocalEventById } from "@/lib/stores/eventStore";
import { getEventById as getRemoteEventById } from "@/lib/services/eventService";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Calendar, MapPin, Users } from "lucide-react";
import { format } from "date-fns";

interface EventWithRegistrations {
  id: string;
  title: string;
  description: string;
  long_description: string | null;
  image_url: string | null;
  event_date: string;
  location: string | null;
  max_attendees: number | null;
  status: string;
  event_registrations: Array<{ id: string }>;
}

const EventDetail = () => {
  const { id } = useParams();
  const [event, setEvent] = useState<EventWithRegistrations | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchEvent();
    }
  }, [id]);

  const fetchEvent = async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    
    try {
      const remote = await getRemoteEventById(id);
      if (remote) {
        setEvent({
          ...remote,
          long_description: (remote as any).long_description || null,
          image_url: remote.image_url || (remote as any).banner_url || null,
          event_registrations: [],
        } as any);
        setLoading(false);
        return;
      }
    } catch (_e) {}

    const eventData = await getLocalEventById(id);
    setEvent(eventData as any);
    setLoading(false);
  };

  const handleRegister = async () => {
    toast({
      title: "Registration Note",
      description: "Event registration system requires backend. Contact admin for registration.",
    });
  };

  const handleUnregister = async () => {
    toast({
      title: "Unregistration Note",
      description: "Event registration system requires backend. Contact admin for unregistration.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navbar />
      
      <main className="container mx-auto px-4 py-24 max-w-5xl">
        <Link to="/events">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Events
          </Button>
        </Link>

        {loading ? (
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-muted rounded" />
            <div className="h-96 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
          </div>
        ) : event ? (
          <div className="space-y-8">
            <div>
              <Badge className="mb-4">{event.status}</Badge>
              <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {event.title}
              </h1>
              <div className="flex flex-wrap gap-6 text-muted-foreground mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span>{format(new Date(event.event_date), "MMMM d, yyyy 'at' h:mm a")}</span>
                </div>
                {event.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    <span>{event.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span>
                    {(event.event_registrations ?? []).length}
                    {event.max_attendees && ` / ${event.max_attendees}`} registered
                  </span>
                </div>
              </div>
              <p className="text-xl text-muted-foreground">{event.description}</p>
            </div>

            {event.image_url && (
              <img
                src={event.image_url}
                alt={event.title}
                className="w-full rounded-lg shadow-lg"
              />
            )}

            <div>
              {isRegistered ? (
                <Button onClick={handleUnregister} variant="outline">
                  Unregister from Event
                </Button>
              ) : (
                <Button onClick={handleRegister}>
                  Register for Event
                </Button>
              )}
            </div>

            {event.long_description && (
              <Card>
                <CardContent className="pt-6">
                  <h2 className="text-2xl font-bold mb-4">Event Details</h2>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {event.long_description}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold mb-4">Event Not Found</h2>
            <p className="text-muted-foreground">The event you're looking for doesn't exist.</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default EventDetail;