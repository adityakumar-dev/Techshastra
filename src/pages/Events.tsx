/**
 * Events Page
 * 
 * Lists upcoming workshops, hackathons, and seminars organized by TECHSHASTRA.
 * It also archives past events to showcase the community's activity history.
 */
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, Users, Loader2 } from "lucide-react";
import * as eventStore from "@/lib/stores/eventStore";
import * as eventService from "@/lib/services/eventService";
import { format } from "date-fns";

const Events = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const data = await eventService.getEvents();
      if (data && data.length > 0) {
        setEvents(data);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn("Failed to fetch remote events, falling back:", err);
    }
    try {
      const data = await eventStore.getEvents();
      setEvents(data);
    } catch (err) {
      console.error("Failed to fetch events", err);
    } finally {
      setLoading(false);
    }
  };

  const upcomingEvents = events.filter(e => e.status === "upcoming" || e.status === "ongoing");
  const pastEvents = events.filter(e => e.status === "completed" || e.status === "cancelled");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <main className="pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="text-center mb-16 space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold">
              Events & <span className="text-primary">Workshops</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Join our technical events, workshops, and hackathons to learn, build, and network
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-muted-foreground animate-pulse">Loading club calendar...</p>
            </div>
          ) : (
            <>
              {/* Upcoming Events */}
              <div className="mb-20">
                <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
                  <div className="h-8 w-1 bg-primary rounded-full"></div>
                  Upcoming <span className="text-primary">Events</span>
                </h2>
                
                {upcomingEvents.length === 0 ? (
                  <div className="text-center py-16 border border-dashed rounded-3xl bg-muted/20">
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                    <p className="text-muted-foreground">No upcoming events scheduled right now. Check back soon!</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-8">
                    {upcomingEvents.map((event) => (
                      <Card 
                        key={event.id}
                        className="bg-card/50 backdrop-blur-sm border-primary/10 hover:border-primary/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/5 overflow-hidden group"
                      >
                        {/* Event Image */}
                        <div className="relative h-56 overflow-hidden bg-muted">
                          {event.image_url ? (
                            <img 
                              src={event.image_url} 
                              alt={event.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5">
                              <Calendar className="w-16 h-16 text-primary/10" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-80"></div>
                          <div className="absolute top-4 left-4">
                            <Badge className="bg-primary/90 backdrop-blur-md text-primary-foreground border-none">
                              {(event.status || 'upcoming').toUpperCase()}
                            </Badge>
                          </div>
                        </div>

                        <CardContent className="p-5 sm:p-8 space-y-4 sm:space-y-6">
                          <h3 className="text-xl sm:text-2xl font-bold group-hover:text-primary transition-colors">{event.title}</h3>
                          <p className="text-muted-foreground text-xs sm:text-sm line-clamp-2 leading-relaxed">
                            {event.description}
                          </p>

                          {/* Event Details */}
                          <div className="flex flex-wrap items-center gap-3 sm:gap-4 py-3 sm:py-4 border-y border-primary/5 text-xs sm:text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-primary shrink-0" />
                              <span className="font-medium">{format(new Date(event.event_date || event.date || Date.now()), "MMM d, yyyy")}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-primary shrink-0" />
                              <span className="font-medium truncate max-w-[160px] sm:max-w-none">{event.location}</span>
                            </div>
                            {event.max_attendees && (
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-primary shrink-0" />
                                <span className="font-medium">Up to {event.max_attendees} slots</span>
                              </div>
                            )}
                          </div>

                          {/* Register Button */}
                          <Button 
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-11 sm:h-12 rounded-xl transition-all hover:shadow-[0_0_20px_rgba(var(--primary),0.4)]"
                            asChild
                          >
                            <a href="/join">Register Now</a>
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Past Events */}
              <div>
                <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
                  <div className="h-8 w-1 bg-accent rounded-full"></div>
                  Past <span className="text-accent">Events</span>
                </h2>
                
                {pastEvents.length === 0 ? (
                  <p className="text-muted-foreground italic">No past events recorded yet.</p>
                ) : (
                  <div className="grid md:grid-cols-3 gap-6">
                    {pastEvents.map((event) => (
                      <Card 
                        key={event.id}
                        className="bg-card/30 backdrop-blur-sm border-border/50 hover:border-primary/20 transition-all hover:shadow-md overflow-hidden"
                      >
                        <CardContent className="p-6 space-y-4">
                          <div className="flex justify-between items-start">
                            <h3 className="text-lg font-bold line-clamp-1">{event.title}</h3>
                            <Badge variant="outline" className="text-[10px] border-primary/20">
                              {event.status.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                            {event.description}
                          </p>
                          <div className="pt-4 border-t border-border flex justify-between items-center text-xs font-medium">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Calendar className="w-3.5 h-3.5" />
                              {format(new Date(event.event_date || event.date || Date.now()), "MMM d, yyyy")}
                            </div>
                            <span className="text-primary/70">{event.location}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Newsletter CTA */}
          <div className="mt-24">
            <Card className="bg-gradient-to-br from-primary/10 via-background to-accent/10 backdrop-blur-sm border-primary/20 p-12 text-center rounded-[2rem] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary"></div>
              <h3 className="text-3xl font-bold mb-4">Never Miss an Event</h3>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join TECHSHASTRA to get notified about upcoming events, workshops, and opportunities.
              </p>
              <Button 
                size="lg"
                className="bg-primary hover:bg-primary/90 shadow-[0_0_30px_rgba(0,230,118,0.3)]"
                asChild
              >
                <a href="/join">Join Our Community</a>
              </Button>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Events;
