/* ============================================================
   i18n, bilingual content (DA default, EN toggle)
   Single source of truth for all UI copy + the service catalog.
   Usage in HTML:
     <h2 data-i18n="hero.title"></h2>          -> textContent
     <input data-i18n-attr="placeholder:form.name_ph">
     <p data-i18n-html="about.body"></p>        -> innerHTML (allows <strong> etc.)
   ============================================================ */

const RB_TRANSLATIONS = {
  da: {
    "meta.title": "Region Byg & Rådgivning, Byggeri med kvalitet. Rådgivning med indsigt.",
    "meta.title.about": "Om os, Region Byg & Rådgivning",
    "meta.title.services": "Tjenester, Region Byg & Rådgivning",
    "meta.title.private": "Ydelser for private, Region Byg & Rådgivning",
    "meta.title.commercial": "Ydelser for erhverv, Region Byg & Rådgivning",
    "meta.title.custom": "Skræddersyede løsninger, Region Byg & Rådgivning",
    "meta.title.offer": "Anmod om tilbud, Region Byg & Rådgivning",
    "meta.title.consultation": "Book en konsultation, Region Byg & Rådgivning",
    "meta.title.privacy": "Privatlivspolitik, Region Byg & Rådgivning",
    "meta.title.terms": "Vilkår og betingelser, Region Byg & Rådgivning",

    /* Nav */
    "nav.home": "Forside",
    "nav.services": "Tjenester",
    "nav.private": "Privat",
    "nav.commercial": "Erhverv",
    "nav.custom": "Skræddersyet",
    "nav.about": "Om os",
    "nav.contact": "Kontakt",
    "nav.offer": "Få et tilbud",
    "nav.consultation": "Book konsultation",

    /* Hero */
    "hero.eyebrow": "Byggeri · Rådgivning · Projektledelse",
    "hero.title_1": "Vi planlægger.",
    "hero.title_2": "Vi rådgiver.",
    "hero.title_3": "Vi bygger.",
    "hero.lead": "Region Byg leverer professionel byggerådgivning og entreprise for private og erhverv. Fra den første idé og myndighedsgodkendelser til færdigt projekt styrer vi hver fase med fokus på kvalitet, gennemsigtighed og værdi.",
    "hero.cta_offer": "Anmod om tilbud",
    "hero.cta_book": "Book en konsultation",
    "hero.tagline": "Byggeri med kvalitet, til en fair pris.",
    "hero.hl_title": "Administrative & udførende byggeydelser",
    "hero.hl_1": "Byggerådgivning",
    "hero.hl_2": "Nybyggeri & renovering",
    "hero.hl_3": "Myndighedsansøgninger",
    "hero.hl_4": "Tegninger & visualiseringer",
    "hero.hl_5": "Projektledelse",
    "hero.hl_6": "Kvalitetskontrol",

    /* Pillars */
    "pillar.new": "Nybyggeri",
    "pillar.new_d": "Huse, tilbygninger og nye bygninger.",
    "pillar.reno": "Renovering",
    "pillar.reno_d": "Boliger, køkkener, bad, facader og tage.",
    "pillar.advice": "Rådgivning",
    "pillar.advice_d": "Teknisk sparring i alle projektets faser.",
    "pillar.pm": "Projektledelse",
    "pillar.pm_d": "Koordinering, tidsplan og kvalitetskontrol.",

    /* Services */
    "services.eyebrow": "Tjenester",
    "services.title": "Administrative og udførende byggeydelser",
    "services.lead": "Vælg en kategori og find den ydelse, du har brug for. Klik på en ydelse for at anmode om et tilbud.",
    "services.tab_private": "Privat",
    "services.tab_commercial": "Erhverv",
    "services.request": "Anmod om tilbud",
    "services.view": "Se ydelser",

    /* Services hub / client-type chooser */
    "choose.eyebrow": "Kom godt i gang",
    "choose.title": "Hvem bygger vi for?",
    "choose.lead": "Vælg din kundetype, så viser vi de ydelser, der passer til dig, og vi ved fra start, hvordan vi bedst hjælper dig.",
    "choose.private_title": "Privat",
    "choose.private_desc": "Boligejere og private bygherrer, nybyggeri, renovering, tilbygning og rådgivning.",
    "choose.commercial_title": "Erhverv",
    "choose.commercial_desc": "Virksomheder og ejendomsejere, erhvervsbyggeri, totalentreprise, drift og rådgivning.",
    "customers.title": "Vores kunder",

    /* Private services page */
    "showcase.eyebrow": "Vores arbejde",
    "showcase.title": "Fra idé til færdigt resultat",
    "showcase.lead": "Kvalitet og overblik i hver fase af dit byggeprojekt, fra rådgivning til udførelse.",
    "showcase.cap1": "Nybyggeri & renovering",
    "showcase.cap2": "Rådgivning & tilsyn",
    "showcase.cap3": "Projektledelse",

    "private.eyebrow": "Privat · Tjenester",
    "private.title": "Ydelser for private",
    "private.lead": "Fra første idé til færdigt hjem. Vælg en ydelse for at anmode om et uforpligtende tilbud.",

    /* Commercial services page */
    "commercial.eyebrow": "Erhverv · Tjenester",
    "commercial.title": "Ydelser for erhverv",
    "commercial.lead": "Professionelle løsninger til virksomheder og ejendomme. Vælg en ydelse for at anmode om et tilbud.",

    "page.custom_cta": "Anmod om en skræddersyet løsning",

    /* Quality / Welcome page (from the company flyer) */
    "nav.quality": "Kvalitet",
    "quality.eyebrow": "Velkommen",
    "quality.hero_title": "Velkommen til Region Byg & Rådgivning",
    "quality.hero_sub": "Byggeri med kvalitet. Rådgivning med indsigt.",
    "quality.intro1": "Vi er en nyopstartet virksomhed med fokus på at skabe værdi for både private og erhvervskunder.",
    "quality.intro2": "Hos Region Byg & Rådgivning hjælper vi dig trygt gennem byggeprocessen, uanset om det gælder et privat projekt eller en erhvervssag. Vores mål er at gøre processen enkel, overskuelig og professionel fra start til slut.",
    "quality.intro3": "Vi tilbyder rådgivning, projektstyring og udførelse inden for byggeri. Derudover bidrager vi som konsulenter med teknisk sparring og løsninger i alle projektets faser.",
    "quality.intro4": "Som ny virksomhed lægger vi stor vægt på kvalitet, gennemsigtighed og et tæt samarbejde med vores kunder. Vi arbejder struktureret og med fokus på at levere løsninger, der giver værdi, både nu og på den lange bane.",
    "quality.approach_title": "Vores tilgang er enkel",
    "quality.approach_1": "Vi tager udgangspunkt i dine behov",
    "quality.approach_2": "Vi sikrer tæt dialog og gennemsigtighed",
    "quality.approach_3": "Vi leverer gennemarbejdede løsninger",
    "quality.cats_title": "Det kan vi hjælpe med",
    "quality.cat_private_t": "Privat",
    "quality.cat_private_d": "Renovering, tilbygning, ombygning og meget mere.",
    "quality.cat_commercial_t": "Erhverv",
    "quality.cat_commercial_d": "Nybyg, renovering, tilpasning og optimering af erhvervsejendom.",
    "quality.cat_advisor_t": "Rådgivning & konsulent",
    "quality.cat_advisor_d": "Teknisk sparring, projektledelse, tilsyn og rådgivning i alle faser.",
    "quality.cat_trust_t": "Tryghed & kvalitet",
    "quality.cat_trust_d": "Gennemsigtighed, ordentlighed og fokus på holdbare løsninger.",
    "quality.closing": "Uanset om du er privatkunde eller virksomhed, står vi klar til at hjælpe med dit næste projekt, fra idé til færdigt resultat.",
    "quality.partner": "Din samarbejdspartner i byggeri og rådgivning.",
    "quality.about_link": "Læs vores velkomst & værdier",

    /* Custom */
    "custom.eyebrow": "Skræddersyede løsninger",
    "custom.title": "Hvert projekt er unikt",
    "custom.body": "Uanset om du har brug for uafhængig rådgivning, hjælp til myndighedsansøgninger, tekniske tegninger, projektledelse eller komplet udførelse, leverer Region Byg løsninger tilpasset netop dine behov. Vores tilgang kombinerer professionel rådgivning med praktisk byggeerfaring, så vi kan støtte dig fra idé til færdigt resultat.",
    "custom.li1": "Uafhængig rådgivning og teknisk sparring",
    "custom.li2": "Myndighedsansøgninger og dokumentation",
    "custom.li3": "Tegninger og visualiseringer",
    "custom.li4": "Projektledelse og hovedentreprise",
    "custom.li5": "Komplet udførelse fra start til slut",

    /* About */
    "about.eyebrow": "Om os",
    "about.title": "Om Region Byg",
    "about.p1": "Region Byg blev grundlagt for at gøre byggeprocessen enkel for private boligejere, virksomheder og ejendomsejere. Vi tror på, at succesfulde projekter starter med ordentlig planlægning, klar kommunikation og professionel udførelse.",
    "about.p2": "Vores team støtter dig gennem hele byggerejsen, fra den indledende idé og myndighedsansøgninger til projektledelse og endelig aflevering.",
    "about.do_title": "Det gør vi",
    "about.do1": "Nybyggeri",
    "about.do2": "Renovering og ombygning",
    "about.do3": "Byggeansøgninger",
    "about.do4": "Tegninger og visualiseringer",
    "about.do5": "Byggerådgivning",
    "about.do6": "Projektledelse",
    "about.do7": "Hovedentreprise",
    "about.do8": "Kvalitetskontrol",
    "about.note": "Ved at samle rådgivning og udførelse i ét selskab giver vi en strømlinet proces, der sparer tid, reducerer risiko og sikrer kvalitet i hver fase.",
    "stat.1": "Faser styret fra start til slut",
    "stat.1l": "Idé → aflevering",
    "stat.2": "Privat & erhverv",
    "stat.2l": "Begge kundetyper",
    "stat.3": "Ét samlet team",
    "stat.3l": "Rådgivning + udførelse",
    "stat.4": "Kvalitet & gennemsigtighed",
    "stat.4l": "I alle led",

    /* CTA band */
    "cta.title": "Klar til at komme i gang?",
    "cta.body": "Fortæl os om dit projekt, så vender vi tilbage med et uforpligtende tilbud. Eller book en konsultation og tal direkte med en af vores specialister.",

    /* Contact */
    "contact.eyebrow": "Kontakt",
    "contact.title": "Kom i kontakt",
    "contact.lead": "Til alle henvendelser beder vi dig oplyse navn, e-mail, telefon, projektadresse og en kort beskrivelse af projektet.",
    "contact.email_l": "E-mail",
    "contact.phone_l": "Telefon",
    "contact.addr_l": "Adresse",
    "contact.addr_v": "Sjælland, Danmark",
    "contact.hours_l": "Svartid",
    "contact.hours_v": "Inden for 1-2 hverdage",
    "contact.cvr": "CVR: 46452666",
    "nav.privacy": "Privatlivspolitik",
    "nav.terms": "Vilkår og betingelser",
    "custom.choose_prompt": "Vælg din kundetype for at fortsætte",
    "offer.custom_service": "Skræddersyet løsning",
    "form.consent": "Jeg accepterer <a href=\"vilkaar.html\" target=\"_blank\" rel=\"noopener\">vilkårene og betingelserne</a> samt <a href=\"privatlivspolitik.html\" target=\"_blank\" rel=\"noopener\">privatlivspolitikken</a> og behandlingen af mine personoplysninger.",
    "form.err_consent": "Du skal acceptere privatlivspolitikken for at fortsætte.",

    /* Footer */
    "footer.tagline": "Byggeri med kvalitet. Rådgivning med indsigt. Din samarbejdspartner i byggeri og rådgivning, for private og erhverv.",
    "footer.col_nav": "Navigation",
    "footer.col_services": "Tjenester",
    "footer.col_contact": "Kontakt",
    "footer.rights": "Alle rettigheder forbeholdes.",
    "footer.built": "Vi bygger med fokus på kvalitet.",

    /* Generic form */
    "form.required_note": "Felter markeret med * er påkrævede.",
    "form.name": "Fulde navn",
    "form.name_ph": "Fornavn Efternavn",
    "form.email": "E-mailadresse",
    "form.email_ph": "dig@eksempel.dk",
    "form.phone": "Telefonnummer",
    "form.phone_ph": "+45 00 00 00 00",
    "form.address": "Projektadresse",
    "form.address_ph": "Vej og nr.",
    "form.city": "By",
    "form.postal": "Postnummer",
    "form.company": "Firmanavn",
    "form.company_ph": "Firmaets navn",
    "form.cvr_label": "CVR-nummer",
    "form.cvr_ph": "8 cifre",
    "form.err_required": "Dette felt er påkrævet.",
    "form.err_email": "Indtast en gyldig e-mailadresse.",
    "form.err_choice": "Vælg venligst en mulighed.",
    "form.back": "Tilbage",
    "form.next": "Næste",
    "form.submit_offer": "Send anmodning",
    "form.submitting": "Sender …",

    /* Offer wizard */
    "offer.eyebrow": "Få et tilbud",
    "offer.title": "Fortæl os om dit projekt",
    "offer.lead": "Det tager 2-3 minutter. Jo mere du fortæller, desto mere præcist et tilbud kan vi udarbejde.",
    "offer.selected_label": "Valgt ydelse",
    "offer.selected_default": "Generel forespørgsel",
    "offer.ct_title": "Er du privat- eller erhvervskunde?",
    "offer.ct_desc": "Vælg din kundetype, så vi kan tilpasse dit tilbud.",
    "offer.step_of": "Trin",
    "offer.of": "af",

    "offer.s1_title": "Hvad har du brug for hjælp til?",
    "offer.s1_desc": "Vælg det område, der bedst beskriver din opgave.",
    "offer.help_construction": "Byggeri / udførelse",
    "offer.help_renovation": "Renovering",
    "offer.help_consulting": "Rådgivning / ekstern bygherrerådgiver",
    "offer.help_permit": "Byggetilladelse / ansøgning",
    "offer.help_drawings": "Tegninger og visualiseringer",
    "offer.help_pm": "Projektledelse",
    "offer.help_other": "Andet",
    "offer.help_facility": "Facilitetsservice",

    "offer.s2_title": "Beskriv dit projekt",
    "offer.s2_desc": "Fortæl os om projektet, dine mål, krav og eventuelle detaljer.",
    "offer.desc_label": "Projektbeskrivelse",
    "offer.desc_ph": "Beskriv dit projekt, dine ønsker og krav …",

    "offer.s3_title": "Budget og tidsplan",
    "offer.s3_desc": "Et omtrentligt budget og en ønsket tidsramme hjælper os med at planlægge.",
    "offer.budget_label": "Anslået budget (DKK)",
    "offer.budget_ph": "f.eks. 250000",
    "offer.timeline_label": "Ønsket tidsramme",
    "offer.tl_urgent": "Haster (inden for 1 måned)",
    "offer.tl_24": "2-4 måneder",
    "offer.tl_4plus": "Mere end 4 måneder",
    "offer.tl_unsure": "Ved ikke endnu",

    "offer.s4_title": "Tegninger og dokumenter",
    "offer.s4_desc": "Fortæl os, hvor du står med tegninger, og upload dem gerne.",
    "offer.draw_have": "Jeg har eksisterende tegninger",
    "offer.draw_upload": "Jeg uploader tegninger / dokumenter",
    "offer.draw_need_new": "Jeg har brug for nye tegninger",
    "offer.draw_need_viz": "Jeg har brug for tegninger og visualiseringer",
    "offer.draw_none": "Jeg har ingen tegninger endnu",
    "offer.upload_label": "Upload filer (valgfrit)",
    "offer.upload_hint": "PDF, billeder eller tegninger, træk hertil eller klik for at vælge.",
    "offer.upload_max": "Maks. ca. 3 MB i alt (PDF, billeder).",

    "offer.s5_title": "Yderligere oplysninger",
    "offer.s5_desc": "Eventuelle ekstra detaljer, vi bør kende til (valgfrit).",
    "offer.extra_label": "Yderligere oplysninger",
    "offer.extra_ph": "Skriv eventuelle ekstra detaljer her …",

    "offer.s6_title": "Dine kontaktoplysninger",
    "offer.s6_desc": "Så vi kan sende dig dit tilbud.",

    "offer.success_title": "Tak, vi har modtaget din anmodning!",
    "offer.success_body": "Vi kontakter dig hurtigst muligt, typisk inden for 1-2 hverdage, med et tilbud på dit projekt.",
    "offer.success_home": "Tilbage til forsiden",

    /* Confirmation (shared by offer + consultation) */
    "confirm.ref_label": "Dit referencenummer",
    "confirm.ref_hint": "Gem dette nummer, og oplys det, hvis du kontakter os om din henvendelse.",
    "confirm.reach_title": "Sådan kommer du i kontakt",
    "confirm.reach_body": "Har du spørgsmål i mellemtiden, er du altid velkommen til at kontakte os direkte:",
    "confirm.when_label": "Dit ønskede tidspunkt",
    "confirm.print": "Udskriv / gem bekræftelse",

    /* Consultation */
    "cons.eyebrow": "Book konsultation",
    "cons.title": "Book en konsultation",
    "cons.lead": "Tal med en af vores specialister om dit projekt, uanset om du har brug for byggerådgivning, planlægning, myndighedsgodkendelser eller projektledelse, er vi klar til at hjælpe.",
    "cons.date_label": "Ønsket dato og tidspunkt",
    "cons.notes_label": "Yderligere bemærkninger",
    "cons.notes_ph": "Fortæl os kort, hvad konsultationen skal handle om …",
    "cons.submit": "Book konsultation",
    "cons.success_title": "Tak, din anmodning er sendt!",
    "cons.success_body": "Vi kontakter dig hurtigst muligt for at bekræfte din konsultation, typisk inden for 1-2 hverdage.",

    "toast.lang": "Sprog ændret til dansk"
  },

  en: {
    "meta.title": "Region Byg & Rådgivning, Quality Construction. Expert Advice.",
    "meta.title.about": "About us, Region Byg & Rådgivning",
    "meta.title.services": "Services, Region Byg & Rådgivning",
    "meta.title.private": "Services for private clients, Region Byg & Rådgivning",
    "meta.title.commercial": "Services for commercial clients, Region Byg & Rådgivning",
    "meta.title.custom": "Custom solutions, Region Byg & Rådgivning",
    "meta.title.offer": "Get an offer, Region Byg & Rådgivning",
    "meta.title.consultation": "Book a consultation, Region Byg & Rådgivning",
    "meta.title.privacy": "Privacy Policy, Region Byg & Rådgivning",
    "meta.title.terms": "Terms & Conditions, Region Byg & Rådgivning",

    "nav.home": "Home",
    "nav.services": "Services",
    "nav.private": "Private",
    "nav.commercial": "Commercial",
    "nav.custom": "Custom",
    "nav.about": "About",
    "nav.contact": "Contact",
    "nav.offer": "Get an Offer",
    "nav.consultation": "Book a Consultation",

    "hero.eyebrow": "Construction · Consulting · Project Management",
    "hero.title_1": "We Plan.",
    "hero.title_2": "We Advise.",
    "hero.title_3": "We Build.",
    "hero.lead": "Region Byg provides professional construction consulting and contracting for private and commercial clients. From the first idea and authority approvals to project completion, we manage every stage with a focus on quality, transparency, and value.",
    "hero.cta_offer": "Request an Offer",
    "hero.cta_book": "Book a Consultation",
    "hero.tagline": "Quality construction, at a fair price.",
    "hero.hl_title": "Administrative & executive services",
    "hero.hl_1": "Construction consulting",
    "hero.hl_2": "New construction & renovation",
    "hero.hl_3": "Authority applications",
    "hero.hl_4": "Drawings & visualizations",
    "hero.hl_5": "Project management",
    "hero.hl_6": "Quality control",

    "pillar.new": "New Construction",
    "pillar.new_d": "Houses, extensions and new buildings.",
    "pillar.reno": "Renovation",
    "pillar.reno_d": "Homes, kitchens, baths, façades and roofs.",
    "pillar.advice": "Consulting",
    "pillar.advice_d": "Technical guidance at every project stage.",
    "pillar.pm": "Project Management",
    "pillar.pm_d": "Coordination, scheduling and quality control.",

    "services.eyebrow": "Services",
    "services.title": "Administrative & executive construction services",
    "services.lead": "Pick a category and find the service you need. Click a service to request an offer.",
    "services.tab_private": "Private",
    "services.tab_commercial": "Commercial",
    "services.request": "Request an offer",
    "services.view": "View services",

    "choose.eyebrow": "Get started",
    "choose.title": "Who are we building for?",
    "choose.lead": "Choose your client type and we'll show the services that fit you, so we know from the start how best to help.",
    "choose.private_title": "Private",
    "choose.private_desc": "Homeowners and private clients, new construction, renovation, extensions, and advice.",
    "choose.commercial_title": "Commercial",
    "choose.commercial_desc": "Businesses and property owners, commercial construction, turnkey delivery, operations, and consulting.",
    "customers.title": "Our customers",

    "showcase.eyebrow": "Our work",
    "showcase.title": "From idea to finished result",
    "showcase.lead": "Quality and clarity at every phase of your project, from advice to execution.",
    "showcase.cap1": "New construction & renovation",
    "showcase.cap2": "Consulting & supervision",
    "showcase.cap3": "Project management",

    "private.eyebrow": "Private · Services",
    "private.title": "Services for private clients",
    "private.lead": "From the first idea to a finished home. Pick a service to request a no-obligation offer.",

    "commercial.eyebrow": "Commercial · Services",
    "commercial.title": "Services for commercial clients",
    "commercial.lead": "Professional solutions for businesses and properties. Pick a service to request an offer.",

    "page.custom_cta": "Request a tailored solution",

    "nav.quality": "Quality",
    "quality.eyebrow": "Welcome",
    "quality.hero_title": "Welcome to Region Byg & Rådgivning",
    "quality.hero_sub": "Quality construction. Expert advice.",
    "quality.intro1": "We are a newly established company focused on creating value for both private and commercial clients.",
    "quality.intro2": "At Region Byg & Rådgivning we guide you safely through the construction process, whether it's a private project or a commercial case. Our goal is to make the process simple, clear, and professional from start to finish.",
    "quality.intro3": "We offer advisory services, project management, and construction execution. We also act as consultants, providing technical guidance and solutions across every phase of a project.",
    "quality.intro4": "As a new company, we place great emphasis on quality, transparency, and close collaboration with our clients. We work in a structured way, focused on delivering solutions that add value, now and in the long run.",
    "quality.approach_title": "Our approach is simple",
    "quality.approach_1": "We start from your needs",
    "quality.approach_2": "We ensure close dialogue and transparency",
    "quality.approach_3": "We deliver well-considered solutions",
    "quality.cats_title": "How we can help",
    "quality.cat_private_t": "Private",
    "quality.cat_private_d": "Renovation, extensions, remodeling, and much more.",
    "quality.cat_commercial_t": "Commercial",
    "quality.cat_commercial_d": "New builds, renovation, adaptation, and optimization of commercial property.",
    "quality.cat_advisor_t": "Consulting & advisory",
    "quality.cat_advisor_d": "Technical guidance, project management, supervision, and advice at every phase.",
    "quality.cat_trust_t": "Trust & quality",
    "quality.cat_trust_d": "Transparency, integrity, and a focus on durable solutions.",
    "quality.closing": "Whether you're a private client or a business, we're ready to help with your next project, from idea to finished result.",
    "quality.partner": "Your partner in construction and consulting.",
    "quality.about_link": "Read our welcome & values",

    "custom.eyebrow": "Tailored solutions",
    "custom.title": "Every project is unique",
    "custom.body": "Whether you need independent consulting, help with authority applications, technical drawings, project management, or complete construction services, Region Byg delivers solutions adapted to your specific needs. Our approach combines professional advisory services with practical construction expertise, supporting you from concept to completion.",
    "custom.li1": "Independent consulting and technical guidance",
    "custom.li2": "Authority applications and documentation",
    "custom.li3": "Drawings and visualizations",
    "custom.li4": "Project management and main contracting",
    "custom.li5": "Complete delivery from start to finish",

    "about.eyebrow": "About us",
    "about.title": "About Region Byg",
    "about.p1": "Region Byg was founded to simplify the construction process for private homeowners, businesses, and property owners. We believe successful projects begin with proper planning, clear communication, and professional execution.",
    "about.p2": "Our team supports you throughout the entire construction journey, from the initial concept and authority applications to project management and final delivery.",
    "about.do_title": "What we do",
    "about.do1": "New Construction",
    "about.do2": "Renovation & Remodeling",
    "about.do3": "Building Applications",
    "about.do4": "Drawings & Visualizations",
    "about.do5": "Construction Consulting",
    "about.do6": "Project Management",
    "about.do7": "Main Contracting",
    "about.do8": "Quality Control",
    "about.note": "By combining consulting and contracting under one company, we provide a streamlined process that saves time, reduces risk, and ensures quality at every stage.",
    "stat.1": "Stages managed end to end",
    "stat.1l": "Idea → handover",
    "stat.2": "Private & commercial",
    "stat.2l": "Both client types",
    "stat.3": "One unified team",
    "stat.3l": "Advisory + execution",
    "stat.4": "Quality & transparency",
    "stat.4l": "At every step",

    "cta.title": "Ready to get started?",
    "cta.body": "Tell us about your project and we'll come back with a no-obligation offer. Or book a consultation and speak directly with one of our specialists.",

    "contact.eyebrow": "Contact",
    "contact.title": "Get in touch",
    "contact.lead": "For all inquiries, please provide your full name, email, phone, project address, and a brief description of your project.",
    "contact.email_l": "Email",
    "contact.phone_l": "Phone",
    "contact.addr_l": "Address",
    "contact.addr_v": "Sjælland, Danmark",
    "contact.hours_l": "Response time",
    "contact.hours_v": "Within 1-2 business days",
    "contact.cvr": "CVR: 46452666",
    "nav.privacy": "Privacy policy",
    "nav.terms": "Terms & conditions",
    "custom.choose_prompt": "Choose your client type to continue",
    "offer.custom_service": "Custom solution",
    "form.consent": "I accept the <a href=\"vilkaar.html\" target=\"_blank\" rel=\"noopener\">terms &amp; conditions</a> and the <a href=\"privatlivspolitik.html\" target=\"_blank\" rel=\"noopener\">privacy policy</a> and the processing of my personal data.",
    "form.err_consent": "You must accept the privacy policy to continue.",

    "footer.tagline": "Quality construction. Expert advice. Your partner in building and consulting, for private and commercial clients.",
    "footer.col_nav": "Navigation",
    "footer.col_services": "Services",
    "footer.col_contact": "Contact",
    "footer.rights": "All rights reserved.",
    "footer.built": "We build with a focus on quality.",

    "form.required_note": "Fields marked with * are required.",
    "form.name": "Full name",
    "form.name_ph": "First Last",
    "form.email": "Email address",
    "form.email_ph": "you@example.com",
    "form.phone": "Phone number",
    "form.phone_ph": "+45 00 00 00 00",
    "form.address": "Project address",
    "form.address_ph": "Street and number",
    "form.city": "City",
    "form.postal": "Postal code",
    "form.company": "Company name",
    "form.company_ph": "Your company",
    "form.cvr_label": "CVR number",
    "form.cvr_ph": "8 digits",
    "form.err_required": "This field is required.",
    "form.err_email": "Please enter a valid email address.",
    "form.err_choice": "Please select an option.",
    "form.back": "Back",
    "form.next": "Next",
    "form.submit_offer": "Send request",
    "form.submitting": "Sending …",

    "offer.eyebrow": "Get an offer",
    "offer.title": "Tell us about your project",
    "offer.lead": "It takes 2-3 minutes. The more you share, the more accurate an offer we can prepare.",
    "offer.selected_label": "Selected service",
    "offer.selected_default": "General inquiry",
    "offer.ct_title": "Are you a private or commercial client?",
    "offer.ct_desc": "Choose your client type so we can tailor your offer.",
    "offer.step_of": "Step",
    "offer.of": "of",

    "offer.s1_title": "What do you need help with?",
    "offer.s1_desc": "Choose the area that best describes your project.",
    "offer.help_construction": "Construction / execution",
    "offer.help_renovation": "Renovation",
    "offer.help_consulting": "Consulting / external advisor",
    "offer.help_permit": "Building permit / application",
    "offer.help_drawings": "Drawings & visualizations",
    "offer.help_pm": "Project management",
    "offer.help_other": "Other",
    "offer.help_facility": "Facility services",

    "offer.s2_title": "Describe your project",
    "offer.s2_desc": "Tell us about the project, your goals, requirements and any details.",
    "offer.desc_label": "Project description",
    "offer.desc_ph": "Describe your project, goals and requirements …",

    "offer.s3_title": "Budget and timeline",
    "offer.s3_desc": "An approximate budget and desired timeframe help us plan.",
    "offer.budget_label": "Estimated budget (DKK)",
    "offer.budget_ph": "e.g. 250000",
    "offer.timeline_label": "Desired timeline",
    "offer.tl_urgent": "Urgent (within 1 month)",
    "offer.tl_24": "2-4 months",
    "offer.tl_4plus": "More than 4 months",
    "offer.tl_unsure": "I don't know yet",

    "offer.s4_title": "Drawings and documents",
    "offer.s4_desc": "Let us know where you stand with drawings, and upload them if you have them.",
    "offer.draw_have": "I have existing drawings",
    "offer.draw_upload": "I'll upload drawings / documents",
    "offer.draw_need_new": "I need new drawings",
    "offer.draw_need_viz": "I need drawings and visualizations",
    "offer.draw_none": "I don't have drawings yet",
    "offer.upload_label": "Upload files (optional)",
    "offer.upload_hint": "PDF, images or drawings, drag here or click to choose.",
    "offer.upload_max": "Max ~3 MB total (PDF, images).",

    "offer.s5_title": "Additional information",
    "offer.s5_desc": "Any extra details we should know about (optional).",
    "offer.extra_label": "Additional information",
    "offer.extra_ph": "Add any extra details here …",

    "offer.s6_title": "Your contact information",
    "offer.s6_desc": "So we can send you your offer.",

    "offer.success_title": "Thank you, we've received your request!",
    "offer.success_body": "We will get in touch with you as soon as possible, typically within 1-2 business days, with an offer for your project.",
    "offer.success_home": "Back to home",

    "confirm.ref_label": "Your reference number",
    "confirm.ref_hint": "Save this number and quote it if you contact us about your request.",
    "confirm.reach_title": "How to reach us",
    "confirm.reach_body": "If you have questions in the meantime, you're always welcome to contact us directly:",
    "confirm.when_label": "Your requested time",
    "confirm.print": "Print / save confirmation",

    "cons.eyebrow": "Book a consultation",
    "cons.title": "Book a consultation",
    "cons.lead": "Speak with one of our specialists about your project, whether you need construction advice, planning, authority approvals, or project management support, we're here to help.",
    "cons.date_label": "Preferred date & time",
    "cons.notes_label": "Additional notes",
    "cons.notes_ph": "Tell us briefly what the consultation should cover …",
    "cons.submit": "Book consultation",
    "cons.success_title": "Thank you, your request has been sent!",
    "cons.success_body": "We will get in touch with you as soon as possible to confirm your consultation, typically within 1-2 business days.",

    "toast.lang": "Language switched to English"
  }
};

/* ---- Service catalog (shared by Services section + Offer prefill) ---- */
const RB_SERVICES = {
  private: [
    { slug: "new-construction",  icon: "home",    da: "Nybyggeri",                       en: "New Construction",
      da_d: "Opførelse af huse, tilbygninger, garager, skure og andre bygninger.",
      en_d: "Construction of houses, extensions, garages, sheds, and other buildings." },
    { slug: "renovation",        icon: "reno",    da: "Renovering",                      en: "Renovation",
      da_d: "Renovering af boliger, køkkener, badeværelser, kældre, facader og tage.",
      en_d: "Renovation of homes, kitchens, bathrooms, basements, façades, and roofs." },
    { slug: "extensions",        icon: "expand",  da: "Tilbygning & ombygning",          en: "Extensions & Remodeling",
      da_d: "Udvidelse af eksisterende ejendomme, omkonfigurering af planløsninger og optimering af pladsen.",
      en_d: "Expanding existing properties, reconfiguring layouts, and optimizing space." },
    { slug: "consulting",        icon: "advice",  da: "Rådgivning",                      en: "Consulting & Advisory",
      da_d: "Vejledning om projektplanlægning, materialevalg, budget, myndighedskrav og byggeprocessen.",
      en_d: "Guidance on planning, material selection, budgeting, regulations, and the construction process." },
    { slug: "building-permits",  icon: "permit",  da: "Byggetilladelser",                en: "Building Permits",
      da_d: "Hjælp med ansøgninger, tegninger, dokumentation og kommunikation med kommunen.",
      en_d: "Help with permit applications, drawings, documentation, and authority communication." },
    { slug: "project-management",icon: "pm",      da: "Projektledelse",                  en: "Project Management",
      da_d: "Planlægning, koordinering af håndværkere, tidsplan, budget og kvalitetskontrol.",
      en_d: "Planning, coordinating contractors, scheduling, budgeting, and quality control." },
    { slug: "repairs",           icon: "repair",  da: "Bygningsreparation & udbedring",  en: "Building Repairs & Remediation",
      da_d: "Udbedring af fugtskader, konstruktionsfejl, revner, sætningsskader og byggetekniske problemer.",
      en_d: "Repair of moisture damage, structural defects, cracks, settlement, and building problems." }
  ],
  commercial: [
    { slug: "commercial-construction", icon: "building", da: "Erhvervsbyggeri",          en: "Commercial Construction",
      da_d: "Opførelse og indretning af kontorer, butikker, lagerhaller, værksteder og erhvervsfaciliteter.",
      en_d: "Construction and fit-out of offices, retail, warehouses, workshops, and commercial facilities." },
    { slug: "commercial-renovation",   icon: "reno",     da: "Erhvervsrenovering",       en: "Commercial Renovation",
      da_d: "Renovering og modernisering af erhvervsejendomme efter drifts- og myndighedskrav.",
      en_d: "Renovation and modernization of commercial properties to meet operational and regulatory needs." },
    { slug: "design-build",            icon: "turnkey",  da: "Totalentreprise",          en: "Design & Build (Turnkey)",
      da_d: "Komplet projektlevering fra idé og planlægning til udførelse og aflevering.",
      en_d: "Complete project delivery from concept and planning to construction and handover." },
    { slug: "main-contracting",        icon: "pm",       da: "Hovedentreprise",          en: "Main Contracting",
      da_d: "Styring og koordinering af underentreprenører, tidsplaner, budgetter og kvalitetssikring.",
      en_d: "Management and coordination of subcontractors, schedules, budgets, and quality assurance." },
    { slug: "construction-consulting", icon: "advice",   da: "Byggerådgivning",          en: "Construction Consulting",
      da_d: "Teknisk rådgivning, projektgennemgang, mulighedsstudier og økonomistyring.",
      en_d: "Technical consulting, project reviews, feasibility assessments, and cost planning." },
    { slug: "regulatory",              icon: "permit",   da: "Myndigheds- & tilladelseshåndtering", en: "Regulatory & Permit Management",
      da_d: "Støtte til byggetilladelser, compliance, brandkrav og projektdokumentation.",
      en_d: "Support with building permits, compliance, fire safety, and project documentation." },
    { slug: "maintenance",             icon: "repair",   da: "Vedligehold & facilitetsstyring",     en: "Maintenance & Facility Management",
      da_d: "Løbende bygningsvedligehold, reparationer, opgraderinger og renoveringsprojekter.",
      en_d: "Ongoing building maintenance, repairs, upgrades, and refurbishment projects." }
  ]
};

/* ---- i18n engine ---- */
const RB_I18N = (() => {
  const STORAGE_KEY = "rb-lang";
  const SUPPORTED = ["da", "en"];
  let current = "da";

  function get(key, lang = current) {
    return (RB_TRANSLATIONS[lang] && RB_TRANSLATIONS[lang][key]) || RB_TRANSLATIONS.da[key] || key;
  }

  function apply(root = document) {
    document.documentElement.lang = current;

    root.querySelectorAll("[data-i18n]").forEach(el => {
      el.textContent = get(el.dataset.i18n);
    });
    root.querySelectorAll("[data-i18n-html]").forEach(el => {
      el.innerHTML = get(el.dataset.i18nHtml);
    });
    root.querySelectorAll("[data-i18n-attr]").forEach(el => {
      // format: "placeholder:key, aria-label:key2"
      el.dataset.i18nAttr.split(",").forEach(pair => {
        const [attr, key] = pair.split(":").map(s => s.trim());
        if (attr && key) el.setAttribute(attr, get(key));
      });
    });

    const titleEl = document.querySelector("title[data-i18n]");
    if (titleEl) document.title = get(titleEl.dataset.i18n);

    // Reflect active language on toggles
    document.querySelectorAll("[data-lang-btn]").forEach(btn => {
      btn.classList.toggle("is-active", btn.dataset.langBtn === current);
    });

    // Let pages react (e.g. re-render dynamic content)
    document.dispatchEvent(new CustomEvent("rb:langchange", { detail: { lang: current } }));
  }

  function set(lang) {
    if (!SUPPORTED.includes(lang)) return;
    current = lang;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
    apply();
  }

  function init() {
    let saved;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) {}
    // Danish-first: the brand is Danish, so DA is the default until the
    // visitor explicitly chooses EN (which is then remembered).
    current = SUPPORTED.includes(saved) ? saved : "da";
    apply();
  }

  return { get, set, apply, init, lang: () => current };
})();
