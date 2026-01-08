/// <reference types="vite/client" />
import { easeInOut, motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from "@vercel/speed-insights/react"
import { ImageWithFallback } from './components/figma/ImageWithFallback';
import emailjs from '@emailjs/browser';
import { Mail, Facebook, Instagram, ArrowLeft, Home, Trophy, Users } from 'lucide-react';

// Simple media-query hook
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener?.('change', onChange);
    mq.addListener?.(onChange);
    return () => {
      mq.removeEventListener?.('change', onChange);
      mq.removeListener?.(onChange);
    };
  }, [query]);
  return matches;
}

export default function App() {
  const [activeSection, setActiveSection] = useState('Home');
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const formRef = useRef<HTMLFormElement | null>(null);
  const nav = [
    { name: 'Home', icon: Home },
    { name: 'Highlights', icon: Trophy },
    { name: 'About', icon: Users },
    { name: 'Contact', icon: Mail },
  ];
  const navItems = nav.map(n => n.name);

  // Routing helpers to keep URL in sync with section state
  const navigate = useNavigate();
  const location = useLocation();

  const toPath = (section: string) => {
    switch (section) {
      case 'Home':
        return '/';
      case 'Highlights':
        return '/highlights';
      case 'About':
        return '/about';
      case 'Contact':
        return '/contact';
      default:
        return '/';
    }
  };

  const toSection = (pathname: string) => {
    switch (pathname) {
      case '/':
      case '/home':
        return 'Home';
      case '/highlights':
        return 'Highlights';
      case '/about':
        return 'About';
      case '/contact':
        return 'Contact';
      default:
        return 'Home';
    }
  };

  // Set active section when URL path changes (back/forward or deep link)
  useEffect(() => {
    const s = toSection(location.pathname);
    if (s !== activeSection) setActiveSection(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Update URL when section changes via UI navigation
  useEffect(() => {
    const p = toPath(activeSection);
    if (location.pathname !== p) navigate(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection]);

    // Optional: template to send an auto-reply to the sender (set in .env if desired)
    const replyTemplateId = import.meta.env.VITE_EMAILJS_REPLY_TEMPLATE_ID;
    // Optional: fallback contact address shown in the auto-reply (or leave blank to omit)
    const replyContactEmail = import.meta.env.VITE_REPLY_EMAIL || 'hpcsingers@gmail.com';
  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!formRef.current) return;

  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  // 🔒 Config guard
  if (!serviceId || !templateId || !publicKey) {
    console.error("Missing EmailJS configuration", {
      serviceId,
      templateId,
      publicKey,
    });

    if (
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1")
    ) {
      console.warn("Simulating email send on localhost.");
      setTimeout(() => {
        // replace later with toast / modal
        alert("Simulated: Message sent!");
        formRef.current?.reset();
      }, 700);
      return;
    }

    alert("Email service is not configured. Please try again later.");
    return;
  }

  try {
    await emailjs.sendForm(
      serviceId,
      templateId,
      formRef.current,
      publicKey
    );

    alert("Message sent successfully!");
    formRef.current.reset();

      // If a reply template is configured, send an automated acknowledgement to the sender
      if (replyTemplateId && userEmail) {
        const replyParams = {
          to_email: userEmail,
          // template uses {{from_name}} — include both keys for compatibility
          from_name: userName || '',
          name: userName || '',
          // include sender email fields used by some templates
          from_email: userEmail || '',
          email: userEmail || '',
          // include phone if you want it in the reply template
          phone: userPhone || '',
          phone_number: userPhone || '',
          reply_email: replyContactEmail,
          message: `Thanks — we received your message. We'll reply as soon as we can.`
        } as any;

        emailjs.send(serviceId, replyTemplateId, replyParams, publicKey)
          .then(() => {
            console.log('Auto-reply sent to', userEmail);
          }).catch((replyErr) => {
            console.warn('Auto-reply failed:', replyErr);
          });
      }
  } catch (err: any) {
    console.error("EmailJS send error:", err);
    alert("Failed to send message. Please try again later.");
  }
};

  // Animation variants with specified timing
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: easeInOut
      }
    }
  };

  interface AnimatedCounterProps {
    target: number;
    label: string;
    duration?: number;
    showPlus?: boolean; // if true show "100+", if false show "100"
  }

  const AnimatedCounter = ({ target, label, duration = 2000, showPlus = false }: AnimatedCounterProps) => {
    const [count, setCount] = useState(0);
    const [started, setStarted] = useState(false);
    const hasAnimated = useRef(false);

    useEffect(() => {
      if (!started) return;
      let rafId: number | null = null;
      let startTime: number | undefined;
      hasAnimated.current = true;

      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;

        const progress = Math.min((timestamp - startTime) / duration, 1);
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        setCount(Math.floor(easeOutQuart * target));

        if (progress < 1) {
          rafId = requestAnimationFrame(animate);
        }
      };

      rafId = requestAnimationFrame(animate);

      return () => {
        if (rafId != null) cancelAnimationFrame(rafId);
      };
    }, [started, target, duration]);

    return (
      <div
        className="flex flex-col items-center justify-center h-40 sm:h-44 md:h-52 text-center bg-black/50 backdrop-blur-sm rounded-xl md:rounded-2xl p-4 md:p-6 border border-[#FF6A00]/30 shadow-lg shadow-[#FF6A00]/10"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          onViewportEnter={() => {
            if (!hasAnimated.current) {
              setStarted(true);
            }
          }}
        >
          <div 
            className="text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-2"
            style={{
              textShadow: started ? "0 0 20px rgba(255,106,0,0.5)" : "none"
            }}
          >
            {/* show plus only when showPlus === true */}
            {showPlus ? `${count}+` : count}
            {/* or show plus only when reached target:
                {count >= target ? `${count}+` : count}
            */}
          </div>
          <div className="text-white/80 text-sm sm:text-base uppercase tracking-wide">{label}</div>
        </motion.div>
      </div>
    );
  };

  const ScrollingLogos = ({ direction = 'left' }) => {
    const logos = [
      { name: 'HHICC 2025'},
      { name: 'AOVICF 2025'},
      { name: 'HHICC 2024'},
      { name: 'AOVICF 2023'},
      { name: 'NAMCYA 2017'},
      { name: 'AOVICF 2013'},
      { name: 'HHICC 2025'},
      { name: 'AOVICF 2025'},
      { name: 'HHICC 2024'},
      { name: 'AOVICF 2023'},
      { name: 'NAMCYA 2017'},
      { name: 'AOVICF 2013'},

    ];
    
    return (
      <div className="overflow-hidden py-4">
        <motion.div
          animate={{
            x: direction === 'left' ? [0, -300] : [0, 300]
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="flex space-x-12 whitespace-nowrap"
        >
          {[...logos, ...logos, ...logos].map((logo, index) => (
            <div
              key={index}
              className="flex items-center space-x-3 bg-black/20 rounded-full px-4 py-2 border border-[#FF6A00]/10 hover:border-[#FF6A00]/30 transition-all duration-300"
            >
              <span className="text-white/70 text-sm font-medium">{logo.name}</span>
            </div>
          ))}
        </motion.div>
      </div>
    );
  };

  const highlightsEvents = [
    {
      id: 1,
      title: "Andrea O. Veneracion International Choral Festival 2025",
      award: "Manila, Philippines",
      image: "/images/AOV25/main.webp",
      background: "from-black via-red-900/30 to-black",
      description: "The 6th Andrea O. Veneracion International Choral Festival, held at the Areté in Manila, gathered 34 choirs and over 1,200 singers from around the world in a celebration of choral excellence and cultural exchange. Among the participating ensembles, Harmonia Polifonica Chorale earned distinction by receiving Double Gold Diplomas in both the Folk Song and Musica Sacra categories. Beyond the accolades, this achievement reflects the dedication and perseverance of its student-singers, who balanced academic responsibilities with rigorous artistic preparation, embodying discipline, commitment, and passion for choral music.",
      stats: [
        { label: "Gold Diploma", value: "Musica Sacra Category" },
        { label: "Gold Diploma", value: "Folk Song Category" },
      ],
      gallery: [
        "/images/AOV25/1.webp",
        "/images/AOV25/2.webp",
        "/images/AOV25/3.webp",
        "/images/AOV25/4.webp"
      ]
    },
    {
      id: 2,
      title: "Himig Handog International Choral Festival 2025",
      award: "Tagum City, Philippines",
      image: "/images/M25/main.webp",
      background: "from-red-950 via-orange-900/40 to-black",
      description: "The Himig Handog International Choral Competition 2025 is an international choral festival that gathers choirs from different regions to celebrate excellence in choral performance, musical interpretation, and cultural expression. The event features multiple competition categories and culminates in a Grand Prix round. During the competition, Harmonia Polifonica Chorale achieved 3rd Place in the Grand Prix and received distinctions in the Mixed and Folklore categories, including recognition for musical interpretation. The event highlighted artistic discipline, collaboration, and the shared passion of participating ensembles for choral music.",
      stats: [
        { label: "3rd Place", value: "Grand Prix Finals" },
        { label: "Champion", value: "Mixed Category" },
        { label: "Best Interpretation", value: "Mixed Category" },
        { label: "2nd Place", value: "Folklore Category" }
      ],
      gallery: [
        "/images/M25/1.webp",
        "/images/M25/3.webp",
        "/images/M25/2.webp",
        "/images/M25/4.webp"
      ]
    },
    {
      id: 3,
      title: "Himig Handog International Choral Festival 2024",
      award: "Tagum City, Philippines",
      image: "/images/M24/main.webp",
      background: "from-red-950 via-orange-900/40 to-black",
      description: "The 21st Musikahan sa Tagum Festival Himig Handog International Choir Grand Prix 2024 is a choral competition that brings together local and international choirs in a celebration of musical excellence and cultural expression. As part of the festival, participating ensembles compete in various categories, culminating in the Grand Prix Finals. Harmonia Polifonica Chorale marked its return to Musikahan sa Tagum after its last appearance in 2016, participating in the competition and earning distinctions in the Mixed and Folk categories, as well as in the Grand Prix Finals. The event highlighted the choir’s renewed presence on the choral stage and its continued commitment to artistic growth and performance.",
      stats: [
        { label: "2nd Prize", value: "Grand Prix Finals" },
        { label: "2nd Prize", value: "Folk Category" },
        { label: "4th Place", value: "Mixed Category" },
      ],
      gallery: [
        "/images/M24/1.webp",
        "/images/M24/3.webp",
        "/images/M24/2.webp",
        "/images/M24/4.webp"
      ]
    },
    {
      id: 4,
      title: "Andrea O. Veneracion International Choral Festival 2023",
      award: "Makati City, Philippines",
      image: "/images/AOV23/main.webp",
      background: "from-red-950 via-orange-900/40 to-black",
      description: "On July 23rd, Harmonia Polifonica Chorale marked a significant milestone as it returned to the international stage at the Andrea O. Veneracion International Choral Festival in Makati City after several years of hiatus. Competing among choirs from various regions, HPC proudly earned Gold Diplomas in both the Folk Song and Mixed Choir categories, demonstrating the choir’s dedication, artistry, and resilience. This event celebrated not only the choir’s musical achievements but also its successful re-emergence on the international choral scene.",
      stats: [
        { label: "Gold Diploma", value: "Mixed Choir Category" },
        { label: "Gold Diploma", value: "Folk Song Category" },
      ],
      gallery: [
        "/images/AOV23/1.webp",
        "/images/AOV23/4.webp",
        "/images/AOV23/3.webp",
        "/images/AOV23/2.webp"
      ]
    },
  ];

  const heroImages = highlightsEvents.map((event) => event.image);

  useEffect(() => {
    if (!heroImages.length) return;

    const interval = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [heroImages.length]);

  interface Event {
    id: number;
    title: string;
    award: string;
    image: string;
    background: string;
    description: string;
    stats: Array<{ label: string; value: string }>;
    gallery: string[];
  }

  const renderEventDetail = (event: Event) => {
    return (
      <div className="min-h-screen py-20 px-6 overflow-y-auto">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="max-w-6xl mx-auto"
        >
          {/* Back Button */}
          <motion.button
            variants={itemVariants}
            onClick={() => setSelectedEventId(null)}
            className="flex items-center space-x-2 text-white hover:text-[#FF6A00] transition-colors duration-300 mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>

          {/* Event Header */}
          <motion.div variants={itemVariants} className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              {event.title}
            </h1>
            <span className="inline-block px-6 py-3 bg-[#FF6A00]/20 text-[#FF6A00] rounded-full border border-[#FF6A00]/30">
              {event.award}
            </span>
          </motion.div>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Large Image Block */}
            <motion.div variants={itemVariants} className="lg:col-span-2 lg:row-span-2">
              <div className="bg-black/60 backdrop-blur-sm rounded-2xl p-6 border border-[#FF6A00]/20 h-full">
                <div className="w-full lg:w-[90%] h-auto lg:h-[400px] rounded-2xl overflow-hidden mb-8 mx-auto">
                  <ImageWithFallback
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </div>
            </motion.div>

            {/* Description Block */}
            <motion.div variants={itemVariants} className="lg:col-span-1">
              <div className="bg-black/60 backdrop-blur-sm rounded-2xl p-6 border border-[#FF6A00]/20 h-full">
                <h3 className="text-xl font-semibold text-white mb-4">About This Event</h3>
                <p className="text-white/80 leading-relaxed">
                  {event.description}
                </p>
              </div>
            </motion.div>

            {/* Stats Block - Now Dynamic */}
            <motion.div variants={itemVariants} className="lg:col-span-1">
              <div className="bg-black/60 backdrop-blur-sm rounded-2xl p-6 border border-[#FF6A00]/20 h-full">
                <h3 className="text-xl font-semibold text-white mb-4">Accolades</h3>
                <div className="space-y-3">
                  {event.stats.map((stat, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-white/70">{stat.label}</span>
                      <span className="text-white">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Gallery Block - Now Dynamic */}
            <motion.div variants={itemVariants} className="lg:col-span-3">
              <div className="bg-black/60 backdrop-blur-sm rounded-2xl p-6 border border-[#FF6A00]/20">
                <h3 className="text-xl font-semibold text-white mb-4">Performance Gallery</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {event.gallery.map((img, index) => (
                    <div key={index} className="aspect-square rounded-lg overflow-hidden">
                      <ImageWithFallback
                        src={img}
                        alt={`Gallery ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  };

  const renderSection = () => {
    // resolve selected event from id
    const selectedEvent = selectedEventId ? highlightsEvents.find(e => e.id === selectedEventId) ?? null : null;
    if (selectedEvent) {
      return renderEventDetail(selectedEvent);
    }

    switch (activeSection) {
      case 'Home':
        return (
          <div className="min-h-screen flex items-center justify-center px-6 overflow-hidden">
            <style>{`
              @media (max-width: 768px) {
                .mobile-center {
                  display: flex !important;
                  flex-direction: column !important;
                  align-items: center !important;
                  justify-content: center !important;
                  text-align: center !important;
                  width: 100% !important;
                }
                .mobile-center * {
                  text-align: center !important;
                  margin-left: auto !important;
                  margin-right: auto !important;
                }
              }
            `}</style>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="max-w-5xl mx-auto mobile-center"
            >
              {/* Semi-transparent black hero card */}
              <div className="bg-black/60 backdrop-blur-md rounded-2xl p-8 md:p-12 border border-[#FF6A00]/20 shadow-2xl shadow-[#FF6A00]/10 relative overflow-hidden">
                
                {/* Header + Intro Group */}
                <motion.div variants={itemVariants} className="text-center mb-30">
                  <h1 className="text-3xl md:text-6xl lg:text-7xl font-bold text-white mb-4 tracking-tight">
                    Harmonia Polifonica Chorale
                  </h1>
                </motion.div>

                {/* Description + Button / Conductor Info Group */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                  <motion.div
                    variants={itemVariants}
                    className={`space-y-6 ${isDesktop ? 'text-left' : 'text-center flex flex-col items-center justify-center w-full'}`}
                  >
                    <p className="text-sm md:text-xl text-white/90 leading-fit">
                      At our core, we remain a group of friends, dreamers, and believers in music's ability to create memories that last a lifetime.
                    </p>
                    {!isMobile && (
                      <button 
                        onClick={() => setActiveSection('About')}
                        className="border-2 border-white text-white px-8 py-4 rounded-full hover:bg-[#FF6A00] hover:border-[#FF6A00] transition-all duration-300 shadow-lg shadow-[#FF6A00]/20 font-medium"
                      >
                        About Us
                      </button>
                    )}
                    <p className="text-xs text-white/70">
                      Based in Davao City, Philippines
                    </p>
                  </motion.div>

                  <motion.div variants={itemVariants} className="flex justify-center lg:justify-end items-center">
                    <div className="flex items-center space-x-6">
                      <div className="text-center lg:text-right">
                        <h2 className="text-xl md:text-3xl font-semibold text-white mb-">
                          Mark Anthony Babalcon
                        </h2>
                        <p className="text-[#FF6A00] text-lg font-medium">
                          Conductor
                        </p>
                      </div>

                      {/* Logo placeholder: uses ImageWithFallback so it gracefully degrades if file missing */}
                      <div className="hidden lg:flex items-center justify-center">
                        <ImageWithFallback
                          src="/images/Logo.png"
                          alt="Choir logo placeholder"
                          className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-sm border-4 border-[#FF0066] bg-transparent"
                        />
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Photo Group with vignette */}
                <motion.div variants={itemVariants} className="relative">
                  <div className="group relative w-full h-64 md:h-80 rounded-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 z-10 pointer-events-none" />

                    <AnimatePresence mode="wait">
                      <motion.div
                        key={heroImages[currentHeroIndex] || 'fallback-hero'}
                        className="absolute inset-0 origin-center will-change-transform"
                        initial={{ opacity: 0, scale: 1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1 }}
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 1, ease: 'easeInOut' }}
                      >
                        <ImageWithFallback
                          src={heroImages[currentHeroIndex] || '/images/mainImage.webp'}
                          alt={`Highlight ${currentHeroIndex + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </motion.div>
                    </AnimatePresence>

                    {heroImages.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                        {heroImages.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentHeroIndex(index)}
                            className={`h-2 w-2 rounded-full transition-all duration-300 ${
                              index === currentHeroIndex ? 'bg-[#FF6A00] w-6' : 'bg-white/60 hover:bg-white'
                            }`}
                            aria-label={`Go to highlight ${index + 1}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        );

      case 'Highlights':
        return (
          <div className="min-h-screen">
            <div className="snap-y snap-mandatory h-screen overflow-y-auto">
              {highlightsEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial="hidden"
                  whileInView="visible"
                  variants={containerVariants}
                  className="snap-start h-screen flex items-center justify-center px-6"
                >
                  <motion.div 
                    variants={itemVariants}
                    className={`w-full max-w-4xl bg-gradient-to-br ${event.background} rounded-2xl p-8 md:p-12 border border-[#FF6A00]/20 backdrop-blur-sm mb-8 lg:mb-16 lg:px-16`}
                  >
                    {/* Large centered photo */}
                    <div className="w-full lg:w-[90%] h-auto lg:h-[400px] rounded-2xl overflow-hidden mb-8 mx-auto">
                      <ImageWithFallback
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                      />
                    </div>

                    {/* Event title in bold white Poppins */}
                    <h2 className="text-2xl md:text-5xl font-bold text-white text-center mb-2 md:mb-6 lg:mb-8">
                      {event.title}
                    </h2>

                    {/* Place Hosted */}
                    <div className="text-center mb-2 md:mb-6 lg:mb-8">
                      <span className="inline-block px-6 py-3 bg-[#FF6A00]/20 text-[#FF6A00] rounded-full text-lg border border-[#FF6A00]/30 font-medium mb-2 md:mb-6 lg:mb-8">
                        {event.award}
                      </span>
                    </div>

                    {/* Click to Explore CTA */}
                    <div className="text-center">
                      <button
                        onClick={() => setSelectedEventId(event.id)}
                        className="bg-[#FF6A00] hover:bg-[#FF6A00]/80 text-white px-8 py-4 rounded-full font-semibold transition-all duration-300 shadow-lg shadow-[#FF6A00]/30 hover:shadow-[#FF6A00]/50 mb-2 md:mb-6 lg:mb-8"
                      >
                        Click to Explore
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
        );

      case 'About':
        return (
          <div className="min-h-screen py-20 px-6 overflow-y-auto">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="max-w-7xl mx-auto"
            >
              {/* Section Title */}
              <motion.div variants={itemVariants} className="text-center mb-8">
                <h2 className="text-4xl md:text-6xl font-bold text-white mb-4">
                  About Us
                </h2>
              </motion.div>

              {/* Subtitle Box */}
              <motion.div
                variants={itemVariants}
                className="bg-black/60 backdrop-blur-sm rounded-2xl border border-[#FF6A00]/20 px-6 py-8 text-center mb-8"
              >
                <p className="text-base md:text-xl text-white/80">
                  A collective voices from Davao City, united by friendship and the timeless magic of music.
                </p>
              </motion.div>

              {/* Animated Counters Group */}
              <motion.div variants={itemVariants} className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-3 md:gap-6 mb-8">
                <AnimatedCounter target={20} label="Years Performing" />
                <AnimatedCounter target={100} label="Live Performances" showPlus={true} />
                <AnimatedCounter target={39} label="Passionate Voices" showPlus={true}/>
              </motion.div>

              {/* Scrolling Logo Rows Group */}
              <motion.div variants={itemVariants} className="mb-8 bg-black/40 backdrop-blur-sm rounded-2xl border border-[#FF6A00]/20 py-8">
                <ScrollingLogos direction="left" />
                <ScrollingLogos direction="right" />
              </motion.div>

              {/* Bento Box Feed */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Large Story Block */}
                <motion.div variants={itemVariants} className="lg:col-span-2">
                  <div className="bg-black/60 backdrop-blur-sm rounded-2xl p-8 border border-[#FF6A00]/20 h-full">
                    <h3 className="text-3xl font-bold text-white mb-6">Our Story</h3>
                    <p className="text-white/90 leading-relaxed mb-4">
                      Harmonia Polifonica Chorale started within the walls of our institution in Davao City, but our true bond was forged in the hours after class. We are a group built on shared sacrifice, united by late-night rehearsals, the balancing act of daily life, and the collective grind required to find a perfect blend.
                    </p>
                    <p className="text-white/80 leading-relaxed">
                      We are more than just voices from the same school; we are friends who have weathered challenges together. At our core, we remain dreamers and believers, proving that the most beautiful memories are the ones you work hardest to create. Our journey is defined not by where we came from, but by the dedication we give to one another.
                    </p>
                  </div>
                </motion.div>

                {/* Photo Block */}
                <motion.div variants={itemVariants} className="lg:col-span-1">
                  <div className="bg-black/60 backdrop-blur-sm rounded-2xl p-4 border border-[#FF6A00]/20 h-full">
                    <div className="h-64 rounded-xl overflow-hidden">
                      <ImageWithFallback
                        src="/images/about1.webp"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="mt-4">
                      <h4 className="text-white font-semibold">Behind the Scenes</h4>
                      <p className="text-white/70 text-sm">Regular rehearsal conducted on school campus.</p>
                    </div>
                  </div>
                </motion.div>

                {/* Additional Photo Blocks */}
                <motion.div variants={itemVariants} className="lg:col-span-1">
                  <div className="bg-black/60 backdrop-blur-sm rounded-2xl p-4 border border-[#FF6A00]/20 h-full">
                    <div className="h-48 rounded-xl overflow-hidden">
                      <ImageWithFallback
                        src="/images/about2.webp"
                        alt="Warm-up practice session"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="mt-4">
                      <h4 className="text-white font-semibold">Benefit Concert Performance</h4>
                      <p className="text-white/70 text-sm">Supporting 'A Night of Music for Kids of Hope with Cancer' at SMX Convention Center, Davao.</p>
                    </div>
                  </div>
                </motion.div>

                {/* Mission Block */}
                <motion.div variants={itemVariants} className="lg:col-span-2">
                  <div className="bg-black/60 backdrop-blur-sm rounded-2xl p-8 border border-[#FF6A00]/20 h-full">
                    <h3 className="text-2xl font-bold text-[#FF6A00] mb-4">Our Mission</h3>
                    <p className="text-white/90 leading-relaxed">
                      We strive to create music that speaks directly to the heart. We pour our time and energy into every rehearsal so that we can offer something sincere and meaningful to our listeners.<br />
                      <br />
                      We sing not to impress, but to connect. We hope that through our songs, we can bring a little more harmony into the world and share the warmth of our friendship with every person who stops to listen.
                    </p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        );

      case 'Contact':
        return (
          <div className="min-h-screen flex flex-col items-center px-6 py-20">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="w-full max-w-6xl space-y-6"
            >
              {/* Standalone Heading */}
              <motion.div variants={itemVariants} className="text-center">
                <h1 className="text-4xl md:text-6xl font-bold text-white">Book Us</h1>
              </motion.div>

              {/* Main Description */}
              <motion.div
                variants={itemVariants}
                className="bg-black/60 backdrop-blur-sm rounded-2xl border border-[#FF6A00]/20 px-6 py-8 text-center"
              >
                <p className="text-base md:text-xl text-white/80 mb-4">
                  We would be honored to add warmth and harmony to your occasion. We bring professionalism and heart to every performance, whether it's a mass, a reception, or a corporate gathering.
                </p>
                <p className="text-base md:text-xl lg:text-3xl text-white/90 font-bold">
                  Inquire today to save your date.
                </p>
              </motion.div>

              {/* Contact Info Bar */}
              <motion.div
                variants={itemVariants}
                className="bg-black/60 backdrop-blur-sm rounded-2xl border border-[#FF6A00]/20 px-6 py-4"
              >
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  {/* Contact Info - Left Side */}
                  <div className="flex flex-col md:flex-row items-center gap-6 md:gap-12 text-white/80 text-lg text-center md:text-left">
                    <span>hpcsingers@gmail.com</span>
                    <span className="hidden md:block">•</span>
                    <span>+63 635 570 685</span>
                  </div>

                  {/* Social Icons - Right Edge */}
                  <div className="flex items-center gap-4">
                    <motion.a
                      href="https://www.facebook.com/profile.php?id=100086396621687"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="w-12 h-12 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 group-hover:border-[#FF6A00]/40 transition-all duration-300">
                        <Facebook className="w-6 h-6 text-white group-hover:text-[#FF6A00] transition-colors duration-300" />
                      </div>
                    </motion.a>
                    <motion.a
                      href="https://www.instagram.com/usephpc/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="w-12 h-12 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 group-hover:border-[#FF6A00]/40 transition-all duration-300">
                        <Instagram className="w-6 h-6 text-white group-hover:text-[#FF6A00] transition-colors duration-300" />
                      </div>
                    </motion.a>
                  </div>
                </div>
              </motion.div>

              {/* Main Glass Card Container */}
              <motion.div variants={itemVariants} className="bg-black/60 backdrop-blur-sm rounded-2xl border border-[#FF6A00]/20 overflow-hidden">
                {/* Split Content */}
                <div className="grid grid-cols-1 md:grid-cols-2">
                  {/* Left: Contact Form */}
                  <div className="p-8 md:p-12 pb-[220px] md:pb-12">
                    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                      {/* Name Field */}
                      <div>
                        <label className="block text-white/70 text-sm mb-2">Name</label>
                        <input
                          name="name"
                          type="text"
                          placeholder="Juan Dela Cruz"
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          className="w-full bg-black/40 backdrop-blur-sm border border-[#FF6A00]/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:border-[#FF6A00]/50 focus:outline-none transition-colors duration-300"
                        />
                        {/* keep a compatibility field if your EmailJS template expects `from_name` */}
                        <input type="hidden" name="from_name" value={userName} />
                      </div>

                      {/* Email Field */}
                      <div>
                        <label className="block text-white/70 text-sm mb-2">Email</label>
                        <input
                          name="from_email"
                          type="email"
                          placeholder="email@address.com"
                          value={userEmail}
                          onChange={(e) => setUserEmail(e.target.value)}
                          className="w-full bg-black/40 backdrop-blur-sm border border-[#FF6A00]/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:border-[#FF6A00]/50 focus:outline-none transition-colors duration-300"
                        />
                        {/* Provide reply_to for EmailJS reply handling and compatibility with templates using `{{email}}` */}
                        <input type="hidden" name="reply_to" value={userEmail} />
                        {/* Some EmailJS templates use `{{email}}` as the reply placeholder — include it too */}
                        <input type="hidden" name="email" value={userEmail} />
                      </div>

                      {/* Phone Field */}
                      <div>
                        <label className="block text-white/70 text-sm mb-2">Mobile Number</label>
                        <input
                          name="phone"
                          type="tel"
                          placeholder="0917 123 4567"
                          value={userPhone}
                          onChange={(e) => setUserPhone(e.target.value)}
                          className="w-full bg-black/40 backdrop-blur-sm border border-[#FF6A00]/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:border-[#FF6A00]/50 focus:outline-none transition-colors duration-300"
                        />
                        {/* Also include phone for templates expecting `phone_number` */}
                        <input type="hidden" name="phone_number" value={userPhone} />
                      </div>

                      {/* Message Field */}
                      <div>
                        <label className="block text-white/70 text-sm mb-2">Message</label>
                        <textarea
                          name="message"
                          rows={4}
                          placeholder="Hello..."
                          className="w-full bg-black/40 backdrop-blur-sm border border-[#FF6A00]/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:border-[#FF6A00]/50 focus:outline-none transition-colors duration-300 resize-none"
                        />
                      </div>

                      {/* Submit Button */}
                      <motion.button
                        type="submit"
                        className="w-full bg-[#FF6A00] hover:bg-[#FF6A00]/80 text-white font-semibold py-4 rounded-lg transition-all duration-300 shadow-lg shadow-[#FF6A00]/30 hover:shadow-[#FF6A00]/50"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        SUBMIT
                      </motion.button>
                    </form>
                  </div>

                  {/* Right: Portrait and Social Media */}
                  <div className="hidden md:block relative">
                    <div className="h-full relative overflow-hidden md:rounded-r-2xl">
                      <ImageWithFallback
                        src="/images/contactPortrait.webp"
                          alt="Harmonia Polifonica Chorale portrait"
                          className="w-full h-full min-h-[500px] md:min-h-[600px] object-cover"
                        />
                      
                      {/* Dark overlay for better text visibility */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        );

      default:
        return null;
    }
  };

  // Add media query logic for mobile, tablet, and desktop views
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
  const isDesktop = useMediaQuery('(min-width: 1025px)');

  return (
    <div
      className="min-h-screen w-full relative"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", backgroundColor: '#0D0D0D' }}
    >
      {/* Plus Jakarta Sans Font Import */}
      <link
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
        rel="stylesheet"
      />
      
      {/* Background Image */}
      <div className="fixed inset-0">
        <ImageWithFallback src="/images/bgImage.webp" className="w-full h-full object-cover opacity-50" alt="Background" />
        <div className="absolute inset-0 bg-black/50"></div>
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 pb-[220px] md:pb-0">
        {renderSection()}
      </div>

      {/* One or the other, never both */}
      {isDesktop ? (
        <motion.nav
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
          aria-hidden={false}
        >
          <div className="bg-black/60 backdrop-blur-lg rounded-full p-2 border border-[#FF6A00]/20 shadow-2xl">
            <div className="flex space-x-2">
              {nav.map(({ name }) => (
                <motion.button
                  key={name}
                  onClick={() => { setActiveSection(name); setSelectedEventId(null); }}
                  className={`px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300 ${
                    activeSection === name
                      ? 'bg-[#FF6A00] text-white shadow-lg shadow-[#FF6A00]/50'
                      : 'text-white hover:bg[#FF6A00]/10 hover:text-[#FF6A00] hover:shadow-lg hover:shadow-[#FF6A00]/20'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-current={activeSection === name ? 'page' : undefined}
                >
                  {name}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.nav>
      ) : (
        <motion.nav
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
          aria-hidden={false}
        >
          <div className="bg-black/60 backdrop-blur-lg rounded-full p-2 border border-[#FF6A00]/20 shadow-2xl">
            <div className="flex space-x-2">
              {nav.map(({ name, icon: Icon }) => {
                const active = activeSection === name;
                return (
                  <motion.button
                    key={name}
                    onClick={() => { setActiveSection(name); setSelectedEventId(null); }}
                    className={`px-6 py-3 rounded-full flex items-center justify-center transition-all duration-300 ${
                      active
                        ? 'bg-[#FF6A00] text-white shadow-lg shadow-[#FF6A00]/50'
                        : 'text-white hover:bg-[#FF6A00]/10 hover:text-[#FF6A00] hover:shadow-lg hover:shadow-[#FF6A00]/20'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-current={active ? 'page' : undefined}
                    aria-label={name}
                  >
                    <Icon className="h-6 w-6" />
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.nav>
      )}
      <Analytics />
      <SpeedInsights />
    </div>
  );
}